// Copy static assets for standalone mode
const fs = require('fs')
const path = require('path')

const standaloneDir = path.join(process.cwd(), '.next', 'standalone')
const staticDir = path.join(process.cwd(), '.next', 'static')
const publicDir = path.join(process.cwd(), 'public')
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static')
const standalonePublicDir = path.join(standaloneDir, 'public')

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Source does not exist: ${src}`)
    return
  }
  
  const stats = fs.statSync(src)
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    const files = fs.readdirSync(src)
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      )
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

console.log('Copying static assets for standalone mode...')

// Copy .next/static to .next/standalone/.next/static
if (fs.existsSync(staticDir)) {
  console.log(`Copying ${staticDir} to ${standaloneStaticDir}`)
  copyRecursive(staticDir, standaloneStaticDir)
} else {
  console.warn(`Static directory not found: ${staticDir}`)
}

// Copy public to .next/standalone/public
if (fs.existsSync(publicDir)) {
  console.log(`Copying ${publicDir} to ${standalonePublicDir}`)
  copyRecursive(publicDir, standalonePublicDir)
} else {
  console.warn(`Public directory not found: ${publicDir}`)
}

console.log('Static assets copied successfully!')
