export default function HelpTip({ text }: { text: string }) {
    return (
        <span
            title={text}
            aria-label={text}
            style={{
                cursor: 'help',
                color: 'var(--muted)',
                marginLeft: '4px',
                fontSize: '14px'
            }}
        >
            ⓘ
        </span>
    );
}