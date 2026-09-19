import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Reusable Quill Editor Component (Dark Theme & StrictMode Safe)
 */
export default function QuillEditor({
  value,
  onChange,
  placeholder = 'เขียนเนื้อหาที่นี่...',
  readOnly = false
}) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // เคลียร์DOM ป้องกันซ้ำซ้อนจาก Strict Mode
    containerRef.current.innerHTML = '';
    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    // 1. สร้าง Quill Instance
    const quill = new Quill(editorDiv, {
      theme: 'snow',
      placeholder: placeholder,
      readOnly: readOnly,
      modules: {
        toolbar: readOnly
          ? false
          : [
              ['bold', 'underline'],
              [{ color: [] }, { background: [] }],
              ['link']
            ]
      }
    });

    quillRef.current = quill;

    // 2. ตั้งค่าข้อมูลเริ่มต้นถ้ามี
    if (value && value.ops) {
      quill.setContents(value);
    }

    // 3. ดักจับเหตุการณ์พิมพ์ข้อความจากผู้ใช้
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user' && onChange) {
        isInternalChangeRef.current = true;
        const currentDelta = quill.getContents();
        onChange(currentDelta);
      }
    });

    // Cleanup เมื่อ Component ถูก unmount
    return () => {
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // รองรับกรณีที่ value มีการเปลี่ยนแปลงจากภายนอก
  useEffect(() => {
    if (quillRef.current && value) {
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      quillRef.current.setContents(value);
    }
  }, [value]);

  // ปรับสถานะ readOnly หากมีการเปลี่ยนแปลงแบบ dynamic
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <>
      <style>{`
        /* Dark Theme overrides for Quill */
        .quill-dark-wrapper .ql-toolbar.ql-snow {
          background-color: #1e293b;
          border-color: rgba(99, 102, 241, 0.3) !important;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }
        .quill-dark-wrapper .ql-container.ql-snow {
          background-color: #0f172a;
          border-color: rgba(99, 102, 241, 0.3) !important;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          color: #ffffff;
        }
        .quill-dark-wrapper .ql-editor {
          color: #ffffff !important;
          min-height: 150px;
        }
        .quill-dark-wrapper .ql-editor.ql-blank::before {
          color: rgba(148, 163, 184, 0.6) !important;
          font-style: normal;
        }
        .quill-dark-wrapper .ql-snow .ql-stroke {
          stroke: #cbd5e1;
        }
        .quill-dark-wrapper .ql-snow .ql-fill, .quill-dark-wrapper .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          fill: #cbd5e1;
        }
        .quill-dark-wrapper .ql-snow .ql-picker {
          color: #cbd5e1;
        }
        .quill-dark-wrapper .ql-snow .ql-picker-options {
          background-color: #1e293b;
          color: #ffffff;
          border-color: rgba(99, 102, 241, 0.3);
        }
      `}</style>
      <div className="quill-dark-wrapper w-full">
        <div ref={containerRef} />
      </div>
    </>
  );
}