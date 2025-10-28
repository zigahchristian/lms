"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const Editor = ({ value, onChange }: EditorProps) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }),
    []
  );

  return (
    <div className="bg-white rounded-md border border-gray-200">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder="Start typing..."
      />
    </div>
  );
};
