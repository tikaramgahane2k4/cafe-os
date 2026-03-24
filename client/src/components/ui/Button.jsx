const variantStyles = {
  primary: {
    background: 'linear-gradient(135deg, #c67c4e, #a85d31)',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 10px 24px rgba(198,124,78,0.22)',
  },
  secondary: {
    background: 'var(--bg-hover)',
    color: 'var(--text-1)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-2)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
    boxShadow: 'none',
  },
};

const sizeStyles = {
  sm: { padding: '8px 12px', fontSize: 12, borderRadius: 10 },
  md: { padding: '10px 16px', fontSize: 13, borderRadius: 12 },
  lg: { padding: '12px 18px', fontSize: 14, borderRadius: 14 },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  leadingIcon = null,
  trailingIcon = null,
  fullWidth = false,
  style = {},
  ...props
}) {
  const palette = variantStyles[variant] || variantStyles.primary;
  const sizing = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, background 0.18s ease',
        opacity: props.disabled ? 0.6 : 1,
        ...sizing,
        ...palette,
        ...style,
      }}
      onMouseEnter={(event) => {
        if (props.disabled) return;
        event.currentTarget.style.transform = 'translateY(-1px)';
        event.currentTarget.style.boxShadow = palette.boxShadow || 'var(--shadow-md)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = palette.boxShadow || 'none';
      }}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
