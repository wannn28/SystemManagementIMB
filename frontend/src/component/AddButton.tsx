import React from "react";

interface PropsAddButton {
    text: string;
    type?: "red" | "green" | "blue"; // Mendefinisikan tipe yang diizinkan
    setShowModal: (show: boolean) => void;
}

export const AddButtonCategory: React.FC<PropsAddButton> = (props) => {
    // Menentukan kelas berdasarkan tipe
    const buttonClass = () => {
        switch (props.type) {
            case "red":
                return "bg-red-500 hover:bg-red-600";
            case "green":
                return "bg-green-500 hover:bg-green-600";
            case "blue":
            default:
                return "bg-blue-500 hover:bg-blue-600";
        }
    };

    return (
        <div className="py-3">
            <button
                onClick={() => props.setShowModal(true)} // Mengubah logika untuk menampilkan modal
                className={`${buttonClass()} text-white px-4 py-2 rounded-lg`}
            >
                {props.text}
            </button>
        </div>
    );
}