"use client";

import { motion } from "framer-motion";

interface FaceResultProps {
  result: {
    name: string;
    relationship: string;
    confidence: string;
    last_interaction: string;
  };
}

export default function FaceResult({ result }: FaceResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl flex items-center gap-6"
    >
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-success animate-pulse-soft">
          <img
            src={`https://ui-avatars.com/api/?name=${result.name}&background=random&size=128`}
            alt={result.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="flex flex-col">
        <h2 className="text-4xl font-bold text-gray-900 mb-1">{result.name}</h2>
        <p className="text-2xl text-accent font-medium mb-2">{result.relationship}</p>
        <div className="flex gap-4 text-gray-600 text-lg">
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            Confidence: <strong className="text-success">{result.confidence}</strong>
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            {result.last_interaction}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
