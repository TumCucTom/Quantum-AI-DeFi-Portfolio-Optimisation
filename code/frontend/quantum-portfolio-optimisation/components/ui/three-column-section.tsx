"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const carouselData = [
    {
        title: "Quantum x Wormhole Analysis",
        slides: [
            {
                title: "Quantum Monte Carlo Simulations",
                body: "Using quantum RNG for real random numbers and quantum annealing for a sqrt speedup.",
                image: "qmc.png"
            },
            {
                title: "Quantum Topological Data Analysis",
                body: "Finding strucutre in high dimensional data by performing persistent homology using quantum kernel methods.",
image: "tda1.png"            },
            {
                title: "Live Wormhole Data",
                body: "View live data in a variety of manners thanks to wormhole.",
                image: "live.png"            },
            {
                title: "Quantum Topological Data Analysis",
                body: "Finding strucutre in high dimensional data by performing persistent homology using quantum kernel methods.",
image: "tda2.png"            }
        ]
    },
    {
        title: "Quantum Informed AI Assistant",
        slides: [
            {
                title: "|Jesko|^2",
                body: "|Jesko|^2 provides insights into our specific quantum solutions with knowledge in classical finance and DeFi. ",
image: "qmc.png"            },
            {
                title: "|Jesko|^2",
                body: "|Jesko|^2 provides insights into our specific quantum solutions with knowledge in classical finance and DeFi. ",
image: "qmc.png"            },
            {
                title: "|Jesko|^2",
                body: "|Jesko|^2 provides insights into our specific quantum solutions with knowledge in classical finance and DeFi. ",
image: "qmc.png"            },
        ]
    },
    {
        title: "Quantum x AI enhanced Trading",
        slides: [
            {
                title: "|Brian⟩ AI",
                body: "Starkware's Brian AI, imporved with pre execution quantum enhancement",
image: "qmc.png"            },
            {
                title: "|Brian⟩ AI",
                body: "Starkware's Brian AI, imporved with pre execution quantum enhancement",
image: "qmc.png"            },
            {
                title: "|Brian⟩ AI",
                body: "Starkware's Brian AI, imporved with pre execution quantum enhancement",
image: "qmc.png"            },
            {
                title: "|Brian⟩ AI",
                body: "Starkware's Brian AI, imporved with pre execution quantum enhancement",
image: "qmc.png"            }
        ]
    },
    {
        title: "Learn",
        slides: [
            {
                title: "Functionality scripts",
                body: "Our quantum implementations with |Jesko|^2 demystifying.",
image: "qmc.png"            },
            {
                title: "Functionality scripts",
                body: "Our quantum implementations with |Jesko|^2 demystifying.",
image: "qmc.png"            },
            {
                title: "Functionality scripts",
                body: "Our quantum implementations with markdown explainations.",
image: "qmc.png"            },
            {
                title: "Functionality scripts",
                body: "Our quantum implementations with markdown explainations.",
image: "qmc.png"            }
        ]
    }
];

export function ThreeColumnSection() {
    return (
        <section className="relative w-full py-12 bg-gradient-to-b from-[#000510] to-[#002240] text-white space-y-24">
            {carouselData.map((carousel, i) => (
                <div key={i} className="relative px-8">
                    {/* Navigation Buttons */}
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
                        {carousel.title}
                    </h2>

                    <Swiper
                        spaceBetween={24}
                        slidesPerView={1.2}
                        loop={true}
                        navigation={{
                            nextEl: `.swiper-button-next-${i}`,
                            prevEl: `.swiper-button-prev-${i}`
                        }}
                        breakpoints={{
                            768: {slidesPerView: 2},
                            1024: {slidesPerView: 3}
                        }}
                        modules={[Navigation]}
                    >
                        {carousel.slides.map((slide, idx) => (
                            <SwiperSlide key={idx} className="w-[40vw]">
                                <div
                                    className="bg-blue-900/10 border border-blue-400/20 rounded-lg p-6 h-full flex flex-col justify-between">
                                    <h3 className="text-xl font-semibold text-blue-100 mb-2">
                                        {slide.title}
                                    </h3>
                                    <p className="text-blue-200 text-sm mb-4">{slide.body}</p>
                                    <div
                                        className="w-full h-full bg-blue-950/20 rounded flex items-center justify-center">
                                        <img src={slide.image} alt={slide.title}
                                             className="w-full h-full object-cover rounded"/>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    {/* Navigation Buttons under the carousel */}
                    <div className="flex justify-center mt-4 gap-4">
                        <div
                            className={`swiper-button-prev swiper-button-prev-${i} text-blue-300 hover:text-white cursor-pointer text-2xl px-4 select-none`}
                        >

                        </div>
                        <div
                            className={`swiper-button-next swiper-button-next-${i} text-blue-300 hover:text-white cursor-pointer text-2xl px-4 select-none`}
                        >

                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
