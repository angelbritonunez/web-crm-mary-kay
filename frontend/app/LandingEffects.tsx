"use client"

import { useEffect } from "react"

export default function LandingEffects() {
  useEffect(() => {
    const slides = document.querySelectorAll<HTMLElement>(".screen-slide")
    const tabs = document.querySelectorAll<HTMLElement>(".browser-tab")
    const urlBar = document.getElementById("browser-url-bar")

    function showSlide(idx: number) {
      slides.forEach((s, i) => s.classList.toggle("active", i === idx))
      tabs.forEach((t, i) => t.classList.toggle("active", i === idx))
      if (urlBar && slides[idx]) {
        urlBar.textContent = (slides[idx] as HTMLElement).dataset.url || ""
      }
    }

    tabs.forEach((tab, i) => tab.addEventListener("click", () => showSlide(i)))

    let autoIdx = 0
    const interval = setInterval(() => {
      autoIdx = (autoIdx + 1) % slides.length
      showSlide(autoIdx)
    }, 3000)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible")
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el))

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return null
}
