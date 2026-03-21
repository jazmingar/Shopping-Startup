"use client";

import * as React from "react";
import { Send, Camera, X, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string, images?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Ask me anything about your outfit...",
}: ChatInputProps) {
  const [message, setMessage] = React.useState("");
  const [images, setImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const recognitionRef = React.useRef<any>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImages = () => {
    setImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || images.length > 0) {
      onSubmit(message, images.length > 0 ? images : undefined);
      setMessage("");
      clearImages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const hasSpeechSupport =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border border-border bg-card transition-all duration-200",
          isFocused && "border-muted-foreground/50 ring-1 ring-muted-foreground/20"
        )}
      >
        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative inline-block">
                <img
                  src={preview}
                  alt={`Preview ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background hover:bg-foreground/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 p-3">
          <div className="flex gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              <span className="sr-only">Upload photo</span>
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isListening ? "Listening..." : placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 text-base sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {hasSpeechSupport && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              disabled={disabled}
              className={cn(
                "h-9 w-9 shrink-0 rounded-full transition-colors",
                isListening
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Mic className="h-5 w-5" />
              <span className="sr-only">{isListening ? "Stop recording" : "Start recording"}</span>
            </Button>
          )}

          <Button
            type="submit"
            size="icon"
            disabled={disabled || (!message.trim() && images.length === 0)}
            title={disabled ? "Wait for the response to finish" : undefined}
            className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
