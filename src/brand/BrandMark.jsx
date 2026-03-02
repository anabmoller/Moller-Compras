/**
 * BrandMark — Reusable brand mark component
 * Renders the AM square mark with configurable size.
 */
import { SYSTEM_MARK } from './brand';

const SIZES = {
  xs: 'w-7 h-7 rounded-md text-[10px]',
  sm: 'w-8 h-8 rounded-lg text-xs',
  md: 'w-9 h-9 rounded-lg text-sm',
  lg: 'w-12 h-12 rounded-xl text-base',
  xl: 'w-14 h-14 rounded-xl text-lg',
};

export default function BrandMark({ size = 'md', className = '' }) {
  return (
    <div className={`${SIZES[size] || SIZES.md} bg-[#1F2A44] flex items-center justify-center text-white font-bold ${className}`}>
      {SYSTEM_MARK}
    </div>
  );
}
