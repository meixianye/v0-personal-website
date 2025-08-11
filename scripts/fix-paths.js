const fs = require("fs")
const path = require("path")

function fixPaths(dir) {
  // 检查目录是否存在
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  目录 ${dir} 不存在，跳过...`)
    return
  }

  let files
  try {
    files = fs.readdirSync(dir)
  } catch (error) {
    console.error(`❌ 无法读取目录 ${dir}:`, error.message)
    return
  }

  files.forEach((file) => {
    const filePath = path.join(dir, file)

    // 安全检查：确保路径存在且可访问
    let stat
    try {
      stat = fs.statSync(filePath)
    } catch (error) {
      console.log(`⚠️  无法访问 ${filePath}:`, error.message)
      return
    }

    if (stat.isDirectory()) {
      // 递归处理子目录，但跳过某些不需要处理的目录
      if (!file.startsWith(".") && file !== "node_modules" && file !== "public") {
        fixPaths(filePath)
      }
    } else if (stat.isFile()) {
      // 只处理 HTML 和 CSS 文件
      if (file.endsWith(".html")) {
        processHtmlFile(filePath)
      } else if (file.endsWith(".css")) {
        processCssFile(filePath)
      }
    }
  })
}

function processHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8")
    console.log(`🔧 正在修复 ${filePath} 中的路径...`)

    // 修复各种静态资源路径
    // 1. 修复 _next 文件夹路径
    content = content.replace(/src="\/_next\//g, 'src="./_next/')
    content = content.replace(/href="\/_next\//g, 'href="./_next/')

    // 2. 修复图片路径
    content = content.replace(/src="\/images\//g, 'src="./images/')
    content = content.replace(/href="\/images\//g, 'href="./images/')

    // 3. 修复 CSS 中的 url() 路径
    content = content.replace(/url\(\/images\//g, "url(./images/")
    content = content.replace(/url\(\/_next\//g, "url(./_next/")

    // 4. 修复其他绝对路径（但保留外部链接和协议）
    content = content.replace(/src="\/(?!\/|https?:\/\/|mailto:|tel:|#)/g, 'src="./')
    content = content.replace(/href="\/(?!\/|https?:\/\/|mailto:|tel:|#)/g, 'href="./')

    // 5. 修复 link 标签的路径
    content = content.replace(/<link([^>]*?)href="\/([^"/][^"]*?)"([^>]*?)>/g, '<link$1href="./$2"$3>')

    // 6. 修复 script 标签的路径
    content = content.replace(/<script([^>]*?)src="\/([^"/][^"]*?)"([^>]*?)>/g, '<script$1src="./$2"$3>')

    // 7. 修复内联样式中的路径
    content = content.replace(/style="([^"]*?)url$$\/([^)]*?)$$([^"]*?)"/g, 'style="$1url(./$2)$3"')

    fs.writeFileSync(filePath, content)
    console.log(`✅ 已修复 ${filePath}`)
  } catch (error) {
    console.error(`❌ 修复 HTML 文件 ${filePath} 时出错:`, error.message)
  }
}

function processCssFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8")
    console.log(`🎨 正在修复 ${filePath} 中的 CSS 路径...`)

    // 修复 CSS 中的背景图片等路径
    content = content.replace(/url\(\/images\//g, "url(../images/")
    content = content.replace(/url\(\/_next\//g, "url(../_next/")
    content = content.replace(/url\(\/(?!\/|https?:\/\/)/g, "url(../")

    fs.writeFileSync(filePath, content)
    console.log(`✅ 已修复 CSS 文件 ${filePath}`)
  } catch (error) {
    console.error(`❌ 修复 CSS 文件 ${filePath} 时出错:`, error.message)
  }
}

console.log("🚀 开始修复静态文件路径...")

// 检查 out 目录是否存在
const outDir = path.resolve("./out")
console.log(`📍 检查目录: ${outDir}`)

if (!fs.existsSync(outDir)) {
  console.error("❌ out 目录不存在，请先运行 npm run build")
  process.exit(1)
}

// 检查 out 目录是否为目录
let outStat
try {
  outStat = fs.statSync(outDir)
} catch (error) {
  console.error("❌ 无法访问 out 目录:", error.message)
  process.exit(1)
}

if (!outStat.isDirectory()) {
  console.error("❌ out 不是一个目录")
  process.exit(1)
}

try {
  // 修复路径
  fixPaths(outDir)

  console.log("✨ 路径修复完成！")
  console.log("💡 现在可以将 out 文件夹部署到任何静态服务器了")

  // 显示 out 目录的内容
  console.log("\n📁 out 目录内容:")
  const outFiles = fs.readdirSync(outDir)
  outFiles.forEach((file) => {
    const filePath = path.join(outDir, file)
    try {
      const stat = fs.statSync(filePath)
      const type = stat.isDirectory() ? "📁" : "📄"
      console.log(`  ${type} ${file}`)
    } catch (error) {
      console.log(`  ❓ ${file} (无法访问)`)
    }
  })

  // 验证关键文件
  const indexPath = path.join(outDir, "index.html")
  if (fs.existsSync(indexPath)) {
    console.log("\n🔍 验证 index.html 修复结果:")
    const indexContent = fs.readFileSync(indexPath, "utf8")
    const hasRelativePaths = indexContent.includes('src="./_next/') || indexContent.includes('href="./_next/')
    const hasAbsolutePaths = indexContent.includes('src="/_next/') || indexContent.includes('href="/_next/')

    if (hasRelativePaths && !hasAbsolutePaths) {
      console.log("✅ 路径修复成功！所有路径都已转换为相对路径")
    } else if (hasAbsolutePaths) {
      console.log("⚠️  仍有一些绝对路径未修复，请检查")
    } else {
      console.log("ℹ️  未找到 _next 路径，这可能是正常的")
    }
  }
} catch (error) {
  console.error("❌ 修复过程中出现错误:", error.message)
  console.error("错误堆栈:", error.stack)
  process.exit(1)
}
