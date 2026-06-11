"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Editor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  Font,
  Paragraph,
  Heading,
  Alignment,
  List,
  BlockQuote,
  CodeBlock,
  Link,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageStyle,
  Table,
  TableToolbar,
  MediaEmbed,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  HorizontalLine,
  SpecialCharacters,
  Indent,
  IndentBlock,
  Undo,
  Autoformat,
  FindAndReplace,
  Highlight,
  HtmlEmbed,
  Emoji,
  Style,
  ShowBlocks,
  Fullscreen,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "./ckeditor.css";

export interface CKEditorWrapperHandle {
  insertText: (text: string) => void;
}

interface CKEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CKEditorWrapper = forwardRef<CKEditorWrapperHandle, CKEditorWrapperProps>(
  function CKEditorWrapper({ value, onChange, placeholder }, ref) {
    const editorRef = useRef<Editor | null>(null);

    useImperativeHandle(ref, () => ({
      insertText(text: string) {
        const editor = editorRef.current;
        if (editor) {
          editor.model.change((writer) => {
            const position = editor.model.document.selection.getFirstPosition();
            if (position) {
              writer.insertText(text, position);
            }
          });
          editor.editing.view.focus();
        }
      },
    }));

    return (
      <div className="ckeditor-wrapper">
        <CKEditor
          editor={ClassicEditor}
          data={value}
          onReady={(editor: Editor) => {
            editorRef.current = editor;
          }}
          onChange={(event: unknown, editor: { getData: () => string }) => {
            const data = editor.getData();
            onChange(data);
          }}
          config={{
            licenseKey: "GPL",
            plugins: [
              Essentials,
              Bold,
              Italic,
              Underline,
              Strikethrough,
              Code,
              Subscript,
              Superscript,
              Font,
              Paragraph,
              Heading,
              Alignment,
              List,
              BlockQuote,
              CodeBlock,
              Link,
              Image,
              ImageUpload,
              ImageToolbar,
              ImageStyle,
              Table,
              TableToolbar,
              MediaEmbed,
              PasteFromOffice,
              RemoveFormat,
              SourceEditing,
              HorizontalLine,
              SpecialCharacters,
              Indent,
              IndentBlock,
              Undo,
              Autoformat,
              FindAndReplace,
              Highlight,
              HtmlEmbed,
              Emoji,
              Style,
              ShowBlocks,
              Fullscreen,
            ],
            toolbar: {
              items: [
                "undo",
                "redo",
                "|",
                "findAndReplace",
                "showBlocks",
                "fullscreen",
                "|",
                "style",
                "heading",
                "|",
                "fontfamily",
                "fontsize",
                "fontColor",
                "fontBackgroundColor",
                "|",
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "code",
                "subscript",
                "superscript",
                "highlight",
                "removeFormat",
                "|",
                "alignment",
                "|",
                "bulletedList",
                "numberedList",
                "|",
                "outdent",
                "indent",
                "|",
                "blockQuote",
                "codeBlock",
                "horizontalLine",
                "|",
                "link",
                "imageUpload",
                "mediaEmbed",
                "table",
                "htmlEmbed",
                "|",
                "emoji",
                "specialCharacters",
                "sourceEditing",
              ],
              shouldNotGroupWhenFull: false,
            },
            style: {
              definitions: [
                {
                  name: "Article Category",
                  element: "h2",
                  classes: ["category"],
                },
                {
                  name: "Info Box",
                  element: "p",
                  classes: ["info-box"],
                },
                {
                  name: "Alert Box",
                  element: "p",
                  classes: ["alert-box"],
                },
                {
                  name: "Warning Box",
                  element: "p",
                  classes: ["warning-box"],
                },
                {
                  name: "Code Output",
                  element: "pre",
                  classes: ["code-output"],
                },
              ],
            },
            image: {
              toolbar: [
                "imageStyle:inline",
                "imageStyle:block",
                "imageStyle:side",
                "|",
                "toggleImageCaption",
                "imageTextAlternative",
              ],
            },
            table: {
              contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
            },
            htmlEmbed: {
              showPreviews: true,
            },
            placeholder: placeholder || "Enter email template content...",
          }}
        />
      </div>
    );
  }
);

export default CKEditorWrapper;
