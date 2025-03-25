import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import interview from "../assets/interview.png";
import { useAuth } from "../lib/context/AuthContext";

const Home = () => {
  const handleLearnMore = () => {
    window.open("https://github.com/ARK018/Noted", "_blank");
  };

  return (
    <div>
      <Navbar />
      <div className="bg-[#fffffb] w-full h-full mx-auto flex flex-col items-center">
        <div className="flex flex-col gap-3 max-w-[800px] my-20">
          <h1 className="relative font-semibold text-4xl text-center tracking-tight leading-none">
            Welcome to CrackIt
            <br /> Ace Your Interview with AI-Powered {""}
            <span className="relative inline-block border-2 p-1 rounded-lg border-[#C4E456] rotate-[-1.8deg] ">
              Precision!
            </span>
          </h1>
          <p className="text-center text-xl leading-normal font-light text-gray-600 mt-2">
            Your AI Interview platform helps users prepare for job interviews
            with AI-driven interview simulations. It provides real-time feedback
            and detailed assessment in one seamless experience.
          </p>
          <img
            src={interview}
            alt="hero-img"
            className="border border-black/10 rounded-2xl mt-6"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
