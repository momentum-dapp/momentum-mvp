"use client"

export default function Footer() {
    return (
        <footer className="w-full py-8 flex justify-center items-center">
            <span className="text-white text-lg mr-2">Built in</span>
            <span className="text-lg font-bold bg-gradient-to-r from-[#00BDF2] via-[#FF4B6B] to-[#FFB800] bg-clip-text text-transparent hover:bg-gradient-to-l">
                <a href="https://base.org/" target="_blank">Base Network.</a>
            </span>
        </footer>
    )
}
