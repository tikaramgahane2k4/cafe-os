export default function Badge({
  children,
  tone = '#c67c4e',
  background = 'rgba(198,124,78,0.12)',
  dot = false,
  style = {},
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: tone,
        background,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: tone,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
