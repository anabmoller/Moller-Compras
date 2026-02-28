import { colors, fontDisplay } from "../../styles/theme";

/**
 * Shared page header with title and optional subtitle.
 * Replaces duplicate header patterns across admin screens.
 */
export default function PageHeader({
  title,
  subtitle,
  children, // optional right-side content (buttons, etc.)
}) {
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: 22,
              fontWeight: 400,
              color: colors.text,
              margin: "0 0 4px",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontSize: 13, color: colors.textLight }}>
              {subtitle}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
