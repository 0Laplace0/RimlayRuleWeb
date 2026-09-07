import Swal from 'sweetalert2';

export const swalUtils = {
  // 1. ระบบยืนยันมาตรฐาน
  confirm: async (optionsOrTitle, textOrUndefined) => {
    const isObject = typeof optionsOrTitle === 'object' && optionsOrTitle !== null;
    
    const title = isObject ? optionsOrTitle.title : optionsOrTitle;
    const htmlContent = isObject 
      ? (optionsOrTitle.html || optionsOrTitle.text) 
      : textOrUndefined;
    
    const confirmButtonText = isObject ? (optionsOrTitle.confirmButtonText || 'ตกลง') : 'ตกลง';
    const cancelButtonText = isObject ? (optionsOrTitle.cancelButtonText || 'ยกเลิก') : 'ยกเลิก';
    const isDangerous = isObject ? optionsOrTitle.isDangerous : false;

    const confirmBtnBg = isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-500 hover:bg-emerald-600';

    const result = await Swal.fire({
      title: `<span style="color: #ffffff; font-size: 18px; font-weight: bold;">${title || ''}</span>`,
      html: htmlContent?.startsWith('<') 
        ? htmlContent 
        : `<span style="color: #9ca3af; font-size: 14px;">${htmlContent || ''}</span>`,
      background: '#090514',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      buttonsStyling: false, 
      customClass: {
        popup: 'border border-purple-950/60 rounded-[2rem]',
        confirmButton: `px-8 py-2.5 rounded-full font-bold text-sm mx-1.5 text-white focus:outline-none transition-all duration-200 hover:scale-105 cursor-pointer ${confirmBtnBg}`,
        cancelButton: 'px-8 py-2.5 rounded-full font-bold text-sm mx-1.5 text-white bg-gray-700 hover:bg-gray-600 focus:outline-none transition-all duration-200 hover:scale-105 cursor-pointer'
      }
    });

    return result;
  },

  // 2. ระบบแจ้งเตือนสำเร็จ
  success: (title, text = '') => {
    Swal.fire({
      icon: 'success',
      title: `<span style="color: #ffffff; font-size: 18px; font-weight: bold;">${title}</span>`,
      html: text ? `<span style="color: #9ca3af; font-size: 14px;">${text}</span>` : undefined,
      background: '#090514',
      timer: 2000,
      showConfirmButton: false,
      iconColor: '#10b981',
      customClass: {
        popup: 'border border-purple-950/60 rounded-[2rem]'
      }
    });
  },

  // 3. ระบบแจ้งเตือนข้อผิดพลาด
  error: (title, text = '') => {
    Swal.fire({
      icon: 'error',
      title: `<span style="color: #ffffff; font-size: 18px; font-weight: bold;">${title}</span>`,
      html: text ? `<span style="color: #9ca3af; font-size: 14px;">${text}</span>` : undefined,
      background: '#090514',
      confirmButtonText: 'รับทราบ',
      buttonsStyling: false,
      iconColor: '#dc2626',
      customClass: {
        popup: 'border border-purple-950/60 rounded-[2rem]',
        confirmButton: 'px-8 py-2.5 rounded-full font-bold text-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all duration-200 hover:scale-105 cursor-pointer'
      }
    });
  },

  // 4. ฟังก์ชันพรีวิวข้อมูล (Recheck)
  previewConfirm: async ({ actionTitle, image, fields, confirmText, cancelText }) => {
    const fieldsHtml = fields.map(field => {
      if (!field.label) {
        return `
          <div style="margin-bottom:12px;">
            ${field.value}
          </div>
        `;
      }

      return `
        <div style="display:flex;margin-bottom:12px;font-size:14px;line-height:1.5;">
          <span style="color:#a78bfa;font-weight:bold;width:110px;flex-shrink:0;">
            ${field.label}
          </span>
          <span style="${field.isSpecial ? 'color:#10b981;font-weight:bold;' : 'color:#ffffff;'}word-break:break-all;">
            ${field.value}
          </span>
        </div>
      `;
    }).join('');

    const result = await Swal.fire({
      title: `<span style="color:#fff;font-size:22px;font-weight:bold;">${actionTitle}</span>`,
      html: `
        <div style="
          display:flex;
          flex-direction:column;
          align-items:center;
          font-family:sans-serif;
          margin-top:10px;
        ">
          ${
            image
              ? `
          <div style="margin-bottom:24px;">
            <img
              src="${image}"
              style="
                width:130px;
                height:130px;
                border-radius:50%;
                object-fit:cover;
                border:4px solid #8b5cf6;
                box-shadow:0 0 25px rgba(139,92,246,.6);
              "
            />
          </div>
          `
              : ''
          }

          <div style="
            background:#0f0a1c;
            border:1px solid #2e1a47;
            border-radius:18px;
            padding:22px;
            width:100%;
            max-width:650px;
            text-align:left;
          ">
            ${fieldsHtml}
          </div>

          <p style="
            font-size:11px;
            color:#9ca3af;
            margin-top:20px;
          ">
            กรุณาตรวจสอบข้อมูลด้านบนให้ถูกต้องก่อนกดยืนยัน
          </p>
        </div>
      `,
      background: '#090514',
      showCancelButton: true,
      confirmButtonText: confirmText || 'ยืนยัน',
      cancelButtonText: cancelText || 'ยกเลิก',
      buttonsStyling: false,
      customClass: {
        popup: 'border border-purple-950/60 rounded-[2.2rem]',
        confirmButton:
          'px-8 py-2.5 rounded-full font-bold text-sm mx-1.5 text-white bg-red-600 hover:bg-red-700 transition-all duration-200 cursor-pointer',
        cancelButton:
          'px-8 py-2.5 rounded-full font-bold text-sm mx-1.5 text-white bg-gray-700 hover:bg-gray-600 transition-all duration-200 cursor-pointer'
      }
    });

    return result.isConfirmed;
  }
};