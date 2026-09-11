import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Reusable Quill Editor Component
 * @param {Object} value - โครงสร้าง Delta JSON ของเนื้อหา
 * @param {Function} onChange - Callback ส่งคืน Delta ล่าสุดเมื่อมีการพิมพ์หรือจัดรูปแบบ
 * @param {string} placeholder - ข้อความ Placeholder
 * @param {boolean} readOnly - โหมดอ่านอย่างเดียว (ปิด Toolbar และการพิมพ์)
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

    // 1. สร้าง Quill Instance
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      readOnly: readOnly,
      modules: {
        toolbar: readOnly
          ? false
          : [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'blockquote', 'code-block'],
              ['clean']
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

  // รองรับกรณีที่ value มีการเปลี่ยนแปลงจากภายนอก (เช่น โหลดข้อมูล async จาก API)
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
    <div className="quill-editor-wrapper">
      <div ref={containerRef} style={{ minHeight: '200px' }} />
    </div>
  );
}