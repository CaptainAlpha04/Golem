import { useRef } from 'react';

/**
 * Code editor with synced line-number gutter.
 */
export function Editor({ value, onChange }) {
  const textareaRef   = useRef(null);
  const gutterRef     = useRef(null);
  const lineCount     = (value.match(/\n/g) ?? []).length + 1;

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="editor-wrapper">
      {/* Gutter */}
      <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="line-num">{i + 1}</span>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Golem formula editor"
      />
    </div>
  );
}
