import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
}

interface FileManagementProps {
  onFileUpload: (file: File) => void;
  files: FileInfo[];
  onFileDelete: (name: string) => void;
  onFileRename: (oldName: string, newName: string) => void;
}

export const FileManagement: React.FC<FileManagementProps> = ({ onFileUpload, files, onFileDelete, onFileRename }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [renameFile, setRenameFile] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">File Management</h3>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button onClick={() => fileInputRef.current?.click()}>Upload File</Button>
      <ul className="mt-4 space-y-2">
        {files.map(file => (
          <li key={file.name} className="flex items-center gap-2">
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            <Button onClick={() => onFileDelete(file.name)} size="sm" variant="destructive">Delete</Button>
            <Button onClick={() => setRenameFile(file.name)} size="sm">Rename</Button>
            {renameFile === file.name && (
              <>
                <input
                  className="border px-1 mx-1"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="New name"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    onFileRename(file.name, newFileName);
                    setRenameFile('');
                    setNewFileName('');
                  }}
                >Save</Button>
                <Button size="sm" onClick={() => setRenameFile('')}>Cancel</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}; 