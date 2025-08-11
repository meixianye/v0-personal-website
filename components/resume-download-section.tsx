"use client"

import { useState } from "react"
import { FileText, Printer, Share2 } from "lucide-react"

export default function ResumeDownloadSection() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPDF = async () => {
    setIsGenerating(true)

    try {
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default

      const element = document.getElementById("resume-content") || document.body

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("portrait", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const totalPdfHeight = imgHeight * ratio
      const totalPages = Math.ceil(totalPdfHeight / pdfHeight)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const sourceY = i * (pdfHeight / ratio)
        const sourceHeight = Math.min(imgHeight - sourceY, pdfHeight / ratio)

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

      pdf.save("叶梅仙-个人简历.pdf")
    } catch (error) {
      console.error("生成 PDF 时出错:", error)
      alert("生成简历时出现错误，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const printResume = () => {
    window.print()
  }

  const shareResume = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "叶梅仙 - 个人简历",
          text: "Data&AI产品经理 @ Thoughtworks",
          url: window.location.href,
        })
      } catch (error) {
        console.log("分享失败:", error)
      }
    } else {
      // 复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert("链接已复制到剪贴板")
      } catch (error) {
        console.log("复制失败:", error)
      }
    }
  }

  return (
    <section className="bg-white py-8 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-6">获取我的简历</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={downloadPDF}
              disabled={isGenerating}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-lg shadow-md
                transition-all duration-300 transform hover:scale-105
                ${
                  isGenerating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                }
                text-white font-medium min-w-[180px]
              `}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>生成PDF中...</span>
                </>
              ) : (
                <>
                  <FileText size={20} />
                  <span>下载PDF简历</span>
                </>
              )}
            </button>

            <button
              onClick={printResume}
              className="flex items-center gap-3 px-8 py-4 rounded-lg border-2 border-gray-300 
                       hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 
                       text-gray-700 font-medium min-w-[180px]"
            >
              <Printer size={20} />
              <span>打印简历</span>
            </button>

            <button
              onClick={shareResume}
              className="flex items-center gap-3 px-8 py-4 rounded-lg border-2 border-green-300 
                       hover:border-green-400 hover:bg-green-50 transition-all duration-300 
                       text-green-700 font-medium min-w-[180px]"
            >
              <Share2 size={20} />
              <span>分享简历</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">点击下载获取完整的PDF简历，或直接打印当前页面，也可以分享给他人</p>
        </div>
      </div>
    </section>
  )
}
