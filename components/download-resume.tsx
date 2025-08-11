"use client"

import { useState } from "react"
import { Download } from "lucide-react"

export default function DownloadResume() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadResume = async () => {
    setIsGenerating(true)

    try {
      // 动态导入库以减少初始包大小
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default

      // 获取页面内容
      const element = document.getElementById("resume-content") || document.body

      // 配置 html2canvas 选项
      const canvas = await html2canvas(element, {
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      })

      // 创建 PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // 计算图片在 PDF 中的尺寸
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      // 如果内容高度超过一页，需要分页
      const totalPdfHeight = imgHeight * ratio
      const totalPages = Math.ceil(totalPdfHeight / pdfHeight)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const sourceY = i * (pdfHeight / ratio)
        const sourceHeight = Math.min(imgHeight - sourceY, pdfHeight / ratio)

        // 创建临时 canvas 来裁剪当前页面内容
        const pageCanvas = document.createElement("canvas")
        const pageCtx = pageCanvas.getContext("2d")
        pageCanvas.width = imgWidth
        pageCanvas.height = sourceHeight

        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)
          const pageImgData = pageCanvas.toDataURL("image/png")
          pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, sourceHeight * ratio)
        }
      }

      // 下载 PDF
      pdf.save("叶梅仙-个人简历.pdf")
    } catch (error) {
      console.error("生成 PDF 时出错:", error)
      alert("生成简历时出现错误，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={downloadResume}
        disabled={isGenerating}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-full shadow-lg
          transition-all duration-300 transform hover:scale-105
          ${
            isGenerating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          }
          text-white font-medium text-sm
        `}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>生成中...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>下载简历</span>
          </>
        )}
      </button>
    </div>
  )
}
