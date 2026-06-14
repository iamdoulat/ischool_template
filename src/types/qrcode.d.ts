declare module "qrcode" {
    interface QRCodeToDataURLOptions {
        color?: { dark?: string; light?: string };
        width?: number;
        margin?: number;
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
        type?: "image/png" | "image/webp";
        rendererOpts?: { quality?: number };
    }
    interface QRCodeToCanvasOptions {
        color?: { dark?: string; light?: string };
        width?: number;
        margin?: number;
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    }
    export function toCanvas(
        canvas: HTMLCanvasElement,
        text: string,
        options?: QRCodeToCanvasOptions,
        cb?: (error: Error | null, result: unknown) => void
    ): Promise<unknown>;
    export function toDataURL(
        text: string,
        options?: QRCodeToDataURLOptions,
        cb?: (error: Error | null, url: string) => void
    ): Promise<string>;
}
