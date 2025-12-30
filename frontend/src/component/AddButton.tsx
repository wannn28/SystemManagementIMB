import React from "react";
import { FiPlus } from "react-icons/fi";

interface PropsAddButton {
    text: string;
    type?: "red" | "green" | "blue" | "orange"; // Mendefinisikan tipe yang diizinkan
    setShowModal: (show: boolean) => void;
}

export const AddButtonCategory: React.FC<PropsAddButton> = (props) => {
    // Menentukan kelas berdasarkan tipe
    const buttonClass = () => {
        switch (props.type) {
            case "red":
                return "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40";
            case "green":
                return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40";
            case "blue":
                return "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40";
            case "orange":
                return "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40";
            default:
                return "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40";
        }
    };

    return (
        <div className="py-3">
            <button
                onClick={() => props.setShowModal(true)}
                className={`${buttonClass()} text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2`}
            >
                <FiPlus className="w-5 h-5" />
                <span>{props.text}</span>
            </button>
        </div>
    );
}