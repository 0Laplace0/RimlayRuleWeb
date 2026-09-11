import React, { useState } from 'react';
import QuillEditor from '../components/QuillEditor';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  // State สำหรับเก็บข้อมูลเนื้อหาในรูปแบบ Delta JSON
  const [contentDelta, setContentDelta] = useState({ ops: [] });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Payload ที่พร้อมส่งไปยัง Backend (API)
    const payload = {
      title: title,
      content: contentDelta // ส่ง Delta Object ไปบันทึกใน Database
    };

    console.log('ส่งข้อมูลไปยัง API Backend:', payload);
    alert('บันทึกบทความสำเร็จ! (ตรวจสอบข้อมูลใน Developer Console)');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h2>สร้างบทความใหม่ (Create Post)</h2>

      <form onSubmit={handleSubmit}>
        {/* ชื่อบทความ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            หัวข้อบทความ:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ระบุหัวข้อบทความ..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        {/* เรียกใช้งาน Reusable Quill Component */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            เนื้อหา:
          </label>
          <QuillEditor
            value={contentDelta}
            onChange={(newDelta) => setContentDelta(newDelta)}
            placeholder="เริ่มเขียนเนื้อหาบทความได้ที่นี่..."
          />
        </div>

        {/* ปุ่ม Submit */}
        <button
          type="submit"
          style={{
            padding: '10px 24px',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          บันทึกบทความ
        </button>
      </form>

      {/* พรีวิวโครงสร้าง Payload ล่าสุดที่เตรียมส่งลง Database */}
      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h4>พรีวิว Payload (JSON):</h4>
        <pre
          style={{
            background: '#282c34',
            color: '#abb2bf',
            padding: '15px',
            borderRadius: '6px',
            overflowX: 'auto',
            fontSize: '13px'
          }}
        >
          {JSON.stringify({ title, content: contentDelta }, null, 2)}
        </pre>
      </div>
    </div>
  );
}