"use client";

import { FiSearch } from "react-icons/fi";

type FabProps = {
  onClick: () => void;
  isVisible: boolean;
};

const Fab = ({ onClick, isVisible }: FabProps) => {
  if (!isVisible) return null;

  return (
    <button
      className="md:hidden fixed bottom-6 right-6 rounded-full bg-blue-500 p-4 text-white shadow-lg"
      onClick={onClick}
    >
      <FiSearch className="w-5 h-5" />
    </button>
  );
};

export default Fab;
