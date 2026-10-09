import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, FileText, Image, Music, X, Clipboard } from 'lucide-react';

interface UploadZoneProps {
  acceptsText?: boolean;
  acceptsImage?: boolean;
  acceptsFile?: boolean;
  acceptsAudio?: boolean;
  fileHint: string;
  onTextSubmit?: (text: string) => void;
  onFileSubmit?: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({
  acceptsText = false,
  acceptsImage = false,
  acceptsFile = false,
  acceptsAudio = false,
  fileHint,
  onTextSubmit,
  onFileSubmit,
  disabled = false,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = [
    ...(acceptsImage ? ['.png', '.jpg', '.jpeg', '.webp'] : []),
    ...(acceptsFile ? ['.pdf'] : []),
    ...(acceptsAudio ? ['.wav', '.mp3', '.ogg', '.flac'] : []),
  ].join(',');

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Ctrl+V paste support
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file' && acceptsImage) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [disabled, acceptsImage, handleFile]);

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (selectedFile && onFileSubmit) {
      onFileSubmit(selectedFile);
    } else if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
    }
  };

  const hasInput = selectedFile || textInput.trim();

  return (
    <div className="space-y-4">
      {/* File drop zone */}
      {(acceptsImage || acceptsFile || acceptsAudio) && !selectedFile && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-navy-600 hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={disabled}
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-300 mb-1">{fileHint}</p>
          <p className="text-sm text-gray-400">
            Drag and drop, click to browse{acceptsImage ? ', or paste with Ctrl+V' : ''}
          </p>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {preview ? (
                <Image className="w-5 h-5 text-primary shrink-0" />
              ) : selectedFile.name.endsWith('.pdf') ? (
                <FileText className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Music className="w-5 h-5 text-primary shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-white truncate font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button onClick={clearFile} className="text-gray-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" disabled={disabled}>
              <X className="w-5 h-5" />
            </button>
          </div>
          {preview && (
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
          )}
        </div>
      )}

      {/* Text input */}
      {acceptsText && !selectedFile && (
        <div className="relative">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or paste your message text here..."
            maxLength={10000}
            rows={5}
            disabled={disabled}
            className="w-full bg-navy-800 border border-navy-600 rounded-xl p-4 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-sm text-gray-400 font-mono">{textInput.length} / 10,000</span>
            {!textInput && (
              <Clipboard className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      )}

      {/* Submit button */}
      {hasInput && (
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full py-3.5 min-h-[44px] bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze
        </button>
      )}
    </div>
  );
}
