import Swal from "sweetalert2";

// Custom SweetAlert2 Mixin for Toast notifications
export const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    popup: "font-sans rounded-2xl shadow-xl border border-slate-100/80 backdrop-blur-md",
    title: "text-xs font-bold text-slate-800",
  },
});

export const swalToast = (
  message: string,
  icon: "success" | "error" | "warning" | "info" = "success"
) => {
  Toast.fire({
    icon,
    title: message,
  });
};

export const swalConfirm = async ({
  title,
  text,
  confirmButtonText = "ยืนยัน",
  cancelButtonText = "ยกเลิก",
  icon = "warning",
  confirmButtonColor = "#ef4444", // red by default for dangerous ops
}: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
  confirmButtonColor?: string;
}): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: "#64748b",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl p-6 font-sans shadow-2xl border border-slate-100",
      title: "text-lg font-extrabold text-slate-900",
      htmlContainer: "text-sm text-slate-500 font-medium mt-2",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
    },
  });

  return result.isConfirmed;
};

export const swalSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#2563eb",
    confirmButtonText: "ตกลง",
    customClass: {
      popup: "rounded-3xl p-6 font-sans shadow-2xl border border-slate-100",
      title: "text-lg font-extrabold text-slate-900",
      htmlContainer: "text-sm text-slate-600 font-medium mt-2",
      confirmButton: "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
    },
  });
};

export const swalError = (title: string, text?: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "เข้าใจแล้ว",
    customClass: {
      popup: "rounded-3xl p-6 font-sans shadow-2xl border border-slate-100",
      title: "text-lg font-extrabold text-slate-900",
      htmlContainer: "text-sm text-rose-600 font-medium mt-2",
      confirmButton: "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
    },
  });
};

export const swalLoading = (title: string = "กำลังดำเนินการ...") => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: "rounded-3xl p-6 font-sans shadow-2xl border border-slate-100",
      title: "text-base font-bold text-slate-800",
    },
  });
};

export const swalClose = () => {
  Swal.close();
};
