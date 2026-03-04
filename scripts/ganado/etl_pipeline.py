#!/usr/bin/env python3
"""
ETL Pipeline - Módulo Ganadeiro AM Soluciones
Consolidação, limpeza e modelagem de dados de compras, guias e trazabilidad.
"""

import argparse

import pandas as pd
import numpy as np
import json
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="ETL Pipeline - Módulo Ganadeiro")
    parser.add_argument(
        "--input-dir", type=str, default=".",
        help="Directory containing the 3 input files"
    )
    parser.add_argument(
        "--output-dir", type=str, default="./output",
        help="Directory for output files"
    )
    parser.add_argument(
        "--trazabilidad", type=str, default="TRAZABILIDAD.csv",
        help="Trazabilidad CSV filename"
    )
    parser.add_argument(
        "--guias", type=str, default="GUIAS ACTUALIZADAS.xlsx",
        help="Guias XLSX filename"
    )
    parser.add_argument(
        "--compras", type=str, default="COMPRAS DE DESMAMANTES - BD COMPRAS.csv",
        help="Compras CSV filename"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    input_dir = Path(args.input_dir)
    out_dir = Path(args.output_dir)
    geo_dir = out_dir / "geo"

    out_dir.mkdir(parents=True, exist_ok=True)
    geo_dir.mkdir(parents=True, exist_ok=True)

    # ============================================================
    # 1. LOAD RAW DATA
    # ============================================================
    print("=" * 60)
    print("STEP 1: Loading raw data...")
    print("=" * 60)

    traz = pd.read_csv(input_dir / args.trazabilidad)
    guias = pd.read_excel(input_dir / args.guias)
    compras = pd.read_csv(input_dir / args.compras)

    print(f"  TRAZABILIDAD:  {traz.shape[0]} rows x {traz.shape[1]} cols")
    print(f"  GUIAS:         {guias.shape[0]} rows x {guias.shape[1]} cols")
    print(f"  COMPRAS:       {compras.shape[0]} rows x {compras.shape[1]} cols")

    cleaning_log = []

    def log_clean(rule, affected, detail=""):
        cleaning_log.append({
            "rule": rule, "affected_rows": affected, "detail": detail
        })
        print(f"  [CLEAN] {rule}: {affected} rows {detail}")

    # ============================================================
    # 2. CLEAN COMPRAS
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 2: Cleaning COMPRAS DE DESMAMANTES...")
    print("=" * 60)

    # Drop empty unnamed columns
    empty_cols = [c for c in compras.columns if 'Unnamed' in str(c) or c.strip() == '']
    compras.drop(columns=empty_cols, inplace=True)
    log_clean("Drop empty/unnamed columns", len(empty_cols), f"cols: {empty_cols[:5]}")

    # Standardize PROPRIETARIO
    propietario_map = {
        'RURAL BIOENERGIA S.A.': 'RURAL BIOENERGIA S.A.',
        'RURAL BIOENERGIA S.A': 'RURAL BIOENERGIA S.A.',
        'RURAL BIONERGIA S.A': 'RURAL BIOENERGIA S.A.',
        'RURAL BIONERGIA S.A ': 'RURAL BIOENERGIA S.A.',
        'RURAL BIOENERGIA S.A ': 'RURAL BIOENERGIA S.A.',
    }
    before = compras['PROPRIETARIO'].nunique()
    compras['PROPRIETARIO'] = compras['PROPRIETARIO'].map(
        lambda x: propietario_map.get(str(x).strip(), str(x).strip())
    )
    n_after = compras['PROPRIETARIO'].nunique()
    log_clean("Standardize PROPRIETARIO", before - n_after, f"now {n_after} unique")

    # Standardize CATEGORIA
    cat_map = {
        'DESMAMANTES MACHOS': 'DESMAMANTES MACHOS',
        'DESMAMANTES MACHOS ': 'DESMAMANTES MACHOS',
        'DESMAMANTES HEMBRAS': 'DESMAMANTES HEMBRAS',
        'DESMAMANTES HEMBRA': 'DESMAMANTES HEMBRAS',
        'DESMAMANTES': 'DESMAMANTES MACHOS',
        'TORETONES ': 'TORETONES',
        'TORETON': 'TORETONES',
    }
    compras['CATEGORIA'] = compras['CATEGORIA'].map(lambda x: cat_map.get(str(x).strip(), str(x).strip()))
    log_clean("Standardize CATEGORIA", 0, f"now {compras['CATEGORIA'].nunique()} unique categories")

    # Standardize ESTABLECIMIENTO DESTINO
    dest_map = {}
    for val in compras['ESTABLECIMENTO DE DESTINO'].unique():
        clean = str(val).strip().upper()
        if clean == 'LUISPAR':
            clean = 'LUSIPAR'
        dest_map[val] = clean
    compras['ESTABLECIMENTO DE DESTINO'] = compras['ESTABLECIMENTO DE DESTINO'].map(dest_map)
    log_clean("Standardize DESTINO names", 0, f"now {compras['ESTABLECIMENTO DE DESTINO'].nunique()} unique")

    # Parse FECHA
    def parse_date_compras(d):
        if pd.isna(d) or str(d).strip() == '':
            return pd.NaT
        s = str(d).strip()
        for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']:
            try:
                return pd.to_datetime(s, format=fmt)
            except (ValueError, TypeError):
                continue
        try:
            return pd.to_datetime(s, dayfirst=True)
        except (ValueError, TypeError):
            return pd.NaT

    compras['FECHA_PARSED'] = compras['FECHA'].apply(parse_date_compras)
    bad_dates = compras['FECHA_PARSED'].isna().sum()
    log_clean("Parse FECHA dates", bad_dates, "unparseable dates set to NaT")

    # Parse numeric fields with locale-aware decimals
    def parse_numeric_py(val):
        if pd.isna(val):
            return np.nan
        s = str(val).strip().replace('"', '')
        # Handle PY number format: 1.234.567,89
        if ',' in s and '.' in s:
            s = s.replace('.', '').replace(',', '.')
        elif ',' in s:
            s = s.replace(',', '.')
        try:
            return float(s)
        except (ValueError, TypeError):
            return np.nan

    for col in ['PRECIO LIQUIDADO', 'PRECIO LIQUIDADO TOTAL', 'PESO TOTAL SIN DESBASTE (KGS)',
                'PESO PROMEDIO POR CABEZA SIN DESBASTE', 'PESO TOTAL CON DESBASTE (KGS)',
                'PESO PROMEDIO POR CABEZA  BASCULA', 'TOTAL FLETE', 'TOTAL COMISION']:
        if col in compras.columns:
            compras[col + '_NUM'] = compras[col].apply(parse_numeric_py)

    # Standardize PROVEEDOR names (trim + upper)
    def _upper_strip(x):
        return str(x).strip().upper() if pd.notna(x) else x

    for _col in ['PROVEEDOR', 'ESTABLECIMENTO ORIGEN', 'INTERMEDIARIO', 'FLETERO']:
        compras[_col] = compras[_col].apply(_upper_strip)

    # Remove fully empty rows (all key fields null)
    key_fields = ['FECHA', 'PROVEEDOR', 'CANTIDAD TOTAL']
    mask_empty = compras[key_fields].isna().all(axis=1) | (compras['CANTIDAD TOTAL'] == 0)
    n_empty = mask_empty.sum()
    compras = compras[~mask_empty].copy()
    log_clean("Remove empty/zero-quantity rows", n_empty)

    # Detect duplicates
    dup_cols = ['FECHA', 'PROVEEDOR', 'ESTABLECIMENTO ORIGEN', 'CANTIDAD TOTAL', 'ESTABLECIMENTO DE DESTINO']
    dups = compras.duplicated(subset=dup_cols, keep='first')
    n_dups = dups.sum()
    compras_deduped = compras[~dups].copy()
    log_clean("Remove duplicate compras", n_dups, f"based on {dup_cols}")

    # Assign ID
    compras_deduped = compras_deduped.reset_index(drop=True)
    compras_deduped['id_compra'] = range(1, len(compras_deduped) + 1)

    print(f"  COMPRAS clean: {len(compras_deduped)} rows")

    # ============================================================
    # 3. CLEAN GUIAS
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 3: Cleaning GUIAS ACTUALIZADAS...")
    print("=" * 60)

    # Fix finalidad data errors
    guias.loc[guias['finalidad'] == '-23.57827000', 'finalidad'] = np.nan
    guias['finalidad'] = guias['finalidad'].apply(lambda x: str(x).strip().upper() if pd.notna(x) else x)
    finalidad_map = {'ENGORDE': 'ENGORDE', 'FAENA': 'FAENA', 'CRIA': 'CRIA', 'CRA': 'CRIA'}
    guias['finalidad'] = guias['finalidad'].map(lambda x: finalidad_map.get(x, x) if pd.notna(x) else x)
    log_clean("Fix finalidad typos", 0, f"standardized to {guias['finalidad'].nunique()} categories")

    # Standardize establishment names
    guias['nombre_establecimiento_origen'] = guias['nombre_establecimiento_origen'].apply(
        lambda x: str(x).strip().upper() if pd.notna(x) else x)
    guias['nombre_establecimiento_destino'] = guias['nombre_establecimiento_destino'].apply(
        lambda x: str(x).strip().upper() if pd.notna(x) else x)
    guias['nombre_empresa_origen'] = guias['nombre_empresa_origen'].apply(
        lambda x: str(x).strip().upper() if pd.notna(x) else x)
    guias['nombre_empresa_destino'] = guias['nombre_empresa_destino'].apply(
        lambda x: str(x).strip().upper() if pd.notna(x) else x)

    # Clean coordinates
    guias['latitud_origen'] = pd.to_numeric(guias['latitud_origen'], errors='coerce')
    guias['longitud_origen'] = pd.to_numeric(guias['longitud_origen'], errors='coerce')
    guias['latitud_destino'] = pd.to_numeric(guias['latitud_destino'], errors='coerce')
    guias['longitud_destino'] = pd.to_numeric(guias['longitud_destino'], errors='coerce')

    # Validate coordinate ranges (Paraguay: lat -19 to -27, lon -54 to -63)
    bad_coords = ((guias['latitud_origen'].notna()) &
                  ((guias['latitud_origen'] > -19) | (guias['latitud_origen'] < -27) |
                   (guias['longitud_origen'] > -54) | (guias['longitud_origen'] < -63)))
    log_clean("Invalid origin coordinates", bad_coords.sum(), "set to NaN")
    guias.loc[bad_coords, ['latitud_origen', 'longitud_origen']] = np.nan

    # Remove duplicate guias
    guia_dups = guias.duplicated(subset=['nro_guia', 'nro_cota', 'cantidad_animales'], keep='first')
    n_guia_dups = guia_dups.sum()
    guias_clean = guias[~guia_dups].copy()
    log_clean("Remove duplicate guias", n_guia_dups)

    # Parse dates
    guias_clean['fecha_emision'] = pd.to_datetime(guias_clean['fecha_emision'], errors='coerce')

    print(f"  GUIAS clean: {len(guias_clean)} rows")

    # ============================================================
    # 4. CLEAN TRAZABILIDAD
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 4: Cleaning TRAZABILIDAD...")
    print("=" * 60)

    # Keep only relevant sections
    relevant_sections = [
        'Entradas de Compras', 'Solicitación de Guia', 'Lanzamientos de Compras',
        'Programação de Embarque - Vendas', 'ENTRADAS SANTA MARIA', 'ENTRADA CONFINAMIENTO'
    ]
    traz_relevant = traz[traz['Section/Column'].isin(relevant_sections)].copy()
    log_clean("Filter to relevant sections", len(traz) - len(traz_relevant))

    # Standardize establishment names
    traz_relevant['Establecimiento Destino'] = traz_relevant['Establecimiento Destino'].apply(
        lambda x: str(x).strip().upper() if pd.notna(x) else x)

    # Parse dates
    for col in ['Created At', 'Completed At', 'Start Date', 'Due Date', 'Embarque previsto']:
        if col in traz_relevant.columns:
            traz_relevant[col] = pd.to_datetime(traz_relevant[col], errors='coerce')

    print(f"  TRAZABILIDAD clean: {len(traz_relevant)} rows")

    # ============================================================
    # 5. BUILD ENTITY TABLES
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 5: Building entity tables...")
    print("=" * 60)

    # --- FAZENDAS (from GUIAS geocoded data + COMPRAS destinations) ---
    # Collect all establishments with coordinates from GUIAS
    fazendas_origen = guias_clean[[
        'nombre_establecimiento_origen', 'latitud_origen', 'longitud_origen'
    ]].dropna(subset=['nombre_establecimiento_origen']).rename(columns={
        'nombre_establecimiento_origen': 'nome',
        'latitud_origen': 'latitude',
        'longitud_origen': 'longitude',
    })

    fazendas_destino = guias_clean[[
        'nombre_establecimiento_destino', 'latitud_destino', 'longitud_destino'
    ]].dropna(subset=['nombre_establecimiento_destino']).rename(columns={
        'nombre_establecimiento_destino': 'nome',
        'latitud_destino': 'latitude',
        'longitud_destino': 'longitude',
    })

    all_fazendas = pd.concat([fazendas_origen, fazendas_destino])
    # Use median coordinates per establishment (more robust)
    fazendas_geo = all_fazendas.groupby('nome').agg(
        latitude=('latitude', 'median'),
        longitude=('longitude', 'median'),
        n_guias=('latitude', 'size')
    ).reset_index()

    # Add COMPRAS-only establishments
    compras_estabs = set(compras_deduped['ESTABLECIMENTO DE DESTINO'].dropna().unique())
    # compras_estabs used for lookup below

    # Map COMPRAS names to GUIAS names
    estab_alias = {
        'YPOTI': 'ESTANCIA YPOTI',
        'LUSIPAR': 'ESTANCIA LUSIPAR',
        'CIELO AZUL': 'ESTANCIA CIELO AZUL',
        'CERRO MEMBY': 'ESTANCIA CERRO MEMBY',
        'SANTA CLARA': 'EST. SANTA CLARA',
        'YBY PORÃ': 'ESTANCIA YBY PORA',
        'YPOTI 2': 'ESTANCIA YPOTI 2',
        'SANTA MARIA': 'SANTA MARIA',
        'ORO VERDE': 'ORO VERDE',
        'WALLENS': 'WALLENS',
        'IMPERIO': 'IMPERIO',
    }

    # Create final fazendas table
    fazendas_list = []
    faz_id = 1
    faz_id_map = {}  # name -> id

    for _, row in fazendas_geo.iterrows():
        nome = row['nome']
        fazendas_list.append({
            'id_fazenda': faz_id,
            'nome': nome,
            'latitude': row['latitude'] if pd.notna(row['latitude']) else None,
            'longitude': row['longitude'] if pd.notna(row['longitude']) else None,
        })
        faz_id_map[nome] = faz_id
        faz_id += 1

    # Add missing from COMPRAS
    for dest in sorted(compras_estabs):
        alias = estab_alias.get(dest, dest)
        if alias not in faz_id_map and dest not in faz_id_map:
            fazendas_list.append({
                'id_fazenda': faz_id,
                'nome': dest,
                'latitude': None,
                'longitude': None,
            })
            faz_id_map[dest] = faz_id
            faz_id += 1

    df_fazendas = pd.DataFrame(fazendas_list)

    # Enrich with region from COMPRAS
    dept_map = {}
    for _, row in compras_deduped.iterrows():
        est = row.get('ESTABLECIMENTO ORIGEN')
        dept = row.get('DEPARTAMENTO')
        if pd.notna(est) and pd.notna(dept):
            dept_map[est] = str(dept).strip().upper()

    # Map departments to our establishments via alias
    dest_dept = {}
    for _, row in compras_deduped.iterrows():
        dest = row.get('ESTABLECIMENTO DE DESTINO')
        dept = row.get('DEPARTAMENTO')
        if pd.notna(dest) and pd.notna(dept) and dest not in dest_dept:
            dest_dept[dest] = str(dept).strip().upper()

    # Assign tipo (own vs external)
    own_fazendas = {'ESTANCIA YPOTI', 'ESTANCIA LUSIPAR', 'ESTANCIA CIELO AZUL', 'ESTANCIA CERRO MEMBY',
                    'EST. SANTA CLARA', 'ESTANCIA YBY PORA', 'ESTANCIA YPOTI 2', 'SANTA MARIA',
                    'YPOTI', 'LUSIPAR', 'CIELO AZUL', 'CERRO MEMBY', 'SANTA CLARA', 'YBY PORÃ',
                    'YPOTI 2', 'ORO VERDE', 'WALLENS', 'IMPERIO'}

    df_fazendas['tipo'] = df_fazendas['nome'].apply(lambda x: 'PROPRIA' if x in own_fazendas else 'PROVEDOR')

    n_own = (df_fazendas['tipo'] == 'PROPRIA').sum()
    n_sup = (df_fazendas['tipo'] == 'PROVEDOR').sum()
    print(f"  FAZENDAS: {len(df_fazendas)} total ({n_own} own, {n_sup} supplier)")

    # --- PROVEDORES ---
    prov_stats = compras_deduped.groupby('PROVEEDOR').agg(
        n_compras=('id_compra', 'count'),
        total_animales=('CANTIDAD TOTAL', 'sum'),
        primera_compra=('FECHA_PARSED', 'min'),
        ultima_compra=('FECHA_PARSED', 'max'),
    ).reset_index()

    prov_stats = prov_stats.sort_values('total_animales', ascending=False).reset_index(drop=True)
    prov_stats['id_provedor'] = range(1, len(prov_stats) + 1)
    prov_stats = prov_stats.rename(columns={'PROVEEDOR': 'nome'})

    print(f"  PROVEDORES: {len(prov_stats)} unique suppliers")

    # --- COMPRAS TABLE (normalized) ---
    def get_fazenda_id(name):
        if pd.isna(name):
            return None
        name = str(name).strip().upper()
        alias = estab_alias.get(name, name)
        return faz_id_map.get(alias, faz_id_map.get(name, None))

    prov_id_map = dict(zip(prov_stats['nome'], prov_stats['id_provedor']))

    compras_cols = [
        'id_compra', 'FECHA_PARSED', 'PROVEEDOR', 'ESTABLECIMENTO ORIGEN',
        'ESTABLECIMENTO DE DESTINO', 'CATEGORIA', 'CANTIDAD TOTAL',
        'MODALIDAD', 'PRECIO LIQUIDADO_NUM', 'PRECIO LIQUIDADO TOTAL_NUM',
        'PESO TOTAL CON DESBASTE (KGS)_NUM', 'PESO PROMEDIO POR CABEZA  BASCULA',
        'TOTAL FLETE_NUM', 'TOTAL COMISION_NUM',
        'INTERMEDIARIO', 'FLETERO', 'DEPARTAMENTO', 'DISTRITO',
        'PAIS', 'ANO', 'NRO. FACTURA DE COMPRA', 'SOLA MARCA',
    ]
    df_compras = compras_deduped[compras_cols].copy()

    df_compras = df_compras.rename(columns={
        'FECHA_PARSED': 'fecha',
        'PROVEEDOR': 'provedor_nome',
        'ESTABLECIMENTO ORIGEN': 'fazenda_origem_nome',
        'ESTABLECIMENTO DE DESTINO': 'fazenda_destino_nome',
        'CATEGORIA': 'categoria',
        'CANTIDAD TOTAL': 'cantidad_animales',
        'MODALIDAD': 'modalidad',
        'PRECIO LIQUIDADO_NUM': 'precio_unitario',
        'PRECIO LIQUIDADO TOTAL_NUM': 'precio_total',
        'PESO TOTAL CON DESBASTE (KGS)_NUM': 'peso_total_kg',
        'PESO PROMEDIO POR CABEZA  BASCULA': 'peso_promedio_kg',
        'TOTAL FLETE_NUM': 'costo_flete',
        'TOTAL COMISION_NUM': 'costo_comision',
        'INTERMEDIARIO': 'intermediario',
        'FLETERO': 'fletero',
        'DEPARTAMENTO': 'departamento',
        'DISTRITO': 'distrito',
        'PAIS': 'pais',
        'ANO': 'ano',
        'NRO. FACTURA DE COMPRA': 'nro_factura',
        'SOLA MARCA': 'sola_marca',
    })

    df_compras['id_provedor'] = df_compras['provedor_nome'].map(prov_id_map)
    df_compras['id_fazenda_destino'] = df_compras['fazenda_destino_nome'].apply(get_fazenda_id)

    print(f"  COMPRAS: {len(df_compras)} transactions, {df_compras['cantidad_animales'].sum()} total animals")

    # --- GUIAS TABLE (normalized) ---
    guias_cols = [
        'id_guia_traslado', 'nro_guia', 'nro_cota', 'fecha_emision', 'finalidad',
        'nombre_empresa_origen', 'ruc_empresa_origen',
        'nombre_establecimiento_origen', 'cod_establecimiento_origen',
        'nombre_empresa_destino', 'ruc_empresa_destino',
        'nombre_establecimiento_destino', 'cod_establecimiento_destino',
        'latitud_origen', 'longitud_origen', 'latitud_destino', 'longitud_destino',
        'codigo_categoria', 'descripcion_categoria', 'cantidad_animales',
    ]
    df_guias = guias_clean[guias_cols].copy()

    df_guias = df_guias.rename(columns={
        'id_guia_traslado': 'id_guia',
        'fecha_emision': 'fecha',
        'nombre_empresa_origen': 'empresa_origen',
        'ruc_empresa_origen': 'ruc_origen',
        'nombre_establecimiento_origen': 'establecimiento_origen',
        'cod_establecimiento_origen': 'cod_origen',
        'nombre_empresa_destino': 'empresa_destino',
        'ruc_empresa_destino': 'ruc_destino',
        'nombre_establecimiento_destino': 'establecimiento_destino',
        'cod_establecimiento_destino': 'cod_destino',
        'codigo_categoria': 'cod_categoria',
        'descripcion_categoria': 'categoria',
    })

    print(f"  GUIAS: {len(df_guias)} records, {df_guias['cantidad_animales'].sum():.0f} total animals")

    # --- MOVIMENTACOES (from TRAZABILIDAD) ---
    movs_cols = [
        'Task ID', 'Name', 'Section/Column', 'Created At', 'Completed At',
        'Establecimiento Destino', 'Tipo de Movimiento',
        'Cantidad de Animales', 'Embarque previsto',
        'Intermediario', 'Categoria predominante',
        'Assignee', 'Status', 'Prioridade', 'Notes',
    ]
    df_movs = traz_relevant[movs_cols].copy()

    df_movs = df_movs.rename(columns={
        'Task ID': 'id_mov_asana',
        'Name': 'descricao',
        'Section/Column': 'seccion',
        'Created At': 'fecha_creacion',
        'Completed At': 'fecha_completado',
        'Establecimiento Destino': 'destino',
        'Tipo de Movimiento': 'tipo_movimiento',
        'Cantidad de Animales': 'cantidad_animales',
        'Embarque previsto': 'fecha_embarque',
        'Intermediario': 'intermediario',
        'Categoria predominante': 'categoria',
        'Assignee': 'responsavel',
        'Status': 'status',
        'Prioridade': 'prioridad',
        'Notes': 'notas',
    })

    print(f"  MOVIMENTACOES: {len(df_movs)} records")

    # ============================================================
    # 6. GEOLOCATION DATASET
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 6: Building geolocation dataset...")
    print("=" * 60)

    # Merge fazendas with volume data from COMPRAS
    vol_destino = compras_deduped.groupby('ESTABLECIMENTO DE DESTINO')['CANTIDAD TOTAL'].sum().reset_index()
    vol_destino.columns = ['destino', 'volume_animales_recebidos']

    # Volume from GUIAS (origin)
    vol_guia_orig = guias_clean.groupby('nombre_establecimiento_origen')['cantidad_animales'].sum().reset_index()
    vol_guia_orig.columns = ['nome', 'volume_guias_origen']

    # Build geographic dataset from GUIAS origins (supplier farms with coords)
    geo_origins = guias_clean.groupby('nombre_establecimiento_origen').agg(
        latitude=('latitud_origen', 'median'),
        longitude=('longitud_origen', 'median'),
        total_animales=('cantidad_animales', 'sum'),
        n_guias=('nro_guia', 'count'),
        empresa=('nombre_empresa_origen', 'first'),
    ).reset_index().rename(columns={'nombre_establecimiento_origen': 'nome'})

    geo_origins = geo_origins.dropna(subset=['latitude', 'longitude'])

    # Destination farms
    geo_destinos = guias_clean.groupby('nombre_establecimiento_destino').agg(
        latitude=('latitud_destino', 'median'),
        longitude=('longitud_destino', 'median'),
        total_animales_recebidos=('cantidad_animales', 'sum'),
        n_guias=('nro_guia', 'count'),
        empresa=('nombre_empresa_destino', 'first'),
    ).reset_index().rename(columns={'nombre_establecimiento_destino': 'nome'})

    geo_destinos = geo_destinos.dropna(subset=['latitude', 'longitude'])

    print(f"  Origin farms with coords: {len(geo_origins)}")
    print(f"  Destination farms with coords: {len(geo_destinos)}")

    # Build GeoJSON
    def build_geojson(df, role):
        features = []
        for _, row in df.iterrows():
            if pd.isna(row['latitude']) or pd.isna(row['longitude']):
                continue
            props = {}
            for k, v in row.items():
                if k in ['latitude', 'longitude']:
                    continue
                if pd.notna(v) and not isinstance(v, float):
                    props[k] = v
                elif isinstance(v, float) and v == int(v):
                    props[k] = int(v)
                elif isinstance(v, float):
                    props[k] = float(v)
                else:
                    props[k] = str(v)
            props['role'] = role
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row['longitude']), float(row['latitude'])]
                },
                "properties": props
            })
        return features

    features = build_geojson(geo_origins, 'origin')
    features += build_geojson(geo_destinos, 'destination')

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    print(f"  GeoJSON features: {len(features)}")

    # ============================================================
    # 7. ANALYTICS
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 7: Running analytics...")
    print("=" * 60)

    analytics = {}

    # Top provedores by volume
    top_cols = ['nome', 'n_compras', 'total_animales', 'primera_compra', 'ultima_compra']
    top_prov_vol = prov_stats.nlargest(20, 'total_animales')[top_cols]
    analytics['top_provedores_volume'] = top_prov_vol.to_dict('records')
    print("  Top 20 provedores by volume computed")

    # Top provedores by frequency
    top_prov_freq = prov_stats.nlargest(20, 'n_compras')[['nome', 'n_compras', 'total_animales']]
    analytics['top_provedores_frequency'] = top_prov_freq.to_dict('records')

    # Purchase frequency by year
    yearly = compras_deduped.groupby('ANO').agg(
        n_compras=('id_compra', 'count'),
        total_animales=('CANTIDAD TOTAL', 'sum'),
        avg_animales=('CANTIDAD TOTAL', 'mean'),
    ).reset_index()
    analytics['yearly_summary'] = yearly.to_dict('records')
    print(f"  Yearly summary: {len(yearly)} years")

    # Distribution by destination
    by_dest = compras_deduped.groupby('ESTABLECIMENTO DE DESTINO').agg(
        n_compras=('id_compra', 'count'),
        total_animales=('CANTIDAD TOTAL', 'sum'),
    ).reset_index().sort_values('total_animales', ascending=False)
    analytics['by_destination'] = by_dest.to_dict('records')

    # Average animals per purchase
    analytics['avg_animales_por_compra'] = float(compras_deduped['CANTIDAD TOTAL'].mean())
    analytics['median_animales_por_compra'] = float(compras_deduped['CANTIDAD TOTAL'].median())

    # Guias per cota analysis
    guias_per_cota = guias_clean.groupby('nro_cota').agg(
        n_guias=('nro_guia', 'count'),
        total_animales=('cantidad_animales', 'sum'),
    ).reset_index()
    analytics['avg_guias_per_cota'] = float(guias_per_cota['n_guias'].mean())
    analytics['avg_animales_per_cota'] = float(guias_per_cota['total_animales'].mean())

    # Detect duplicate guias
    dup_guias = guias_clean[guias_clean.duplicated(subset=['nro_guia'], keep=False)]
    n_dup_guias = dup_guias['nro_guia'].nunique()
    analytics['guias_duplicadas'] = n_dup_guias
    print(f"  Duplicate guia numbers: {n_dup_guias}")

    # Detect duplicate cotas
    dup_cotas = guias_clean[guias_clean.duplicated(subset=['nro_cota'], keep=False)]
    n_dup_cotas = dup_cotas['nro_cota'].nunique()
    analytics['cotas_duplicadas'] = n_dup_cotas
    print(f"  Duplicate cota numbers: {n_dup_cotas}")

    # Fazendas with incomplete data
    incomplete_faz = df_fazendas[(df_fazendas['latitude'].isna()) | (df_fazendas['longitude'].isna())]
    analytics['fazendas_sem_coordenadas'] = incomplete_faz['nome'].tolist()
    print(f"  Farms without coordinates: {len(incomplete_faz)}")

    # Category distribution in compras
    cat_dist = compras_deduped.groupby('CATEGORIA')['CANTIDAD TOTAL'].sum().sort_values(ascending=False)
    analytics['distribucion_categorias'] = cat_dist.to_dict()

    # Geographic distribution
    dept_dist = compras_deduped.groupby('DEPARTAMENTO')['CANTIDAD TOTAL'].sum().sort_values(ascending=False).head(10)
    analytics['top_departamentos'] = dept_dist.to_dict()

    # ============================================================
    # 8. SAVE ALL OUTPUTS
    # ============================================================
    print("\n" + "=" * 60)
    print("STEP 8: Saving outputs...")
    print("=" * 60)

    # out_dir already set from args

    # Entity tables
    df_fazendas.to_csv(str(out_dir / 'fazendas.csv'), index=False)
    prov_stats.to_csv(str(out_dir / 'provedores.csv'), index=False)
    df_compras.to_csv(str(out_dir / 'compras.csv'), index=False)
    df_guias.to_csv(str(out_dir / 'guias.csv'), index=False)
    df_movs.to_csv(str(out_dir / 'movimentacoes.csv'), index=False)

    # Consolidated base
    consolidated = compras_deduped.copy()
    consolidated.to_csv(str(out_dir / 'base_consolidada_compras.csv'), index=False)

    # Geo data
    geo_origins.to_csv(str(out_dir / 'geo_fazendas_origen.csv'), index=False)
    geo_destinos.to_csv(str(out_dir / 'geo_fazendas_destino.csv'), index=False)

    with open(str(geo_dir / 'fazendas.geojson'), 'w') as f:
        json.dump(geojson, f, indent=2, default=str)

    # Analytics
    with open(str(out_dir / 'analytics.json'), 'w') as f:
        json.dump(analytics, f, indent=2, default=str)

    # Cleaning log
    with open(str(out_dir / 'cleaning_log.json'), 'w') as f:
        json.dump(cleaning_log, f, indent=2, default=str)

    print(f"  Saved {len(df_fazendas)} fazendas")
    print(f"  Saved {len(prov_stats)} provedores")
    print(f"  Saved {len(df_compras)} compras")
    print(f"  Saved {len(df_guias)} guias")
    print(f"  Saved {len(df_movs)} movimentacoes")
    print(f"  Saved GeoJSON with {len(features)} features")
    print("  Saved analytics.json")
    print("  Saved cleaning_log.json")

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    main()
