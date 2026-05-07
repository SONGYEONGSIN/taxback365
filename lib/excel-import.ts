// `xlsx` 패키지(HIGH CVE 2건: Prototype Pollution + ReDoS)를 `exceljs`로 교체한 wrapper.
// admin/page.tsx의 두 호출지점에서 사용. dynamic import로 admin 진입 시에만 번들 로드.

/**
 * 첫 번째 워크시트의 모든 row를 2D 배열(string|number)로 반환.
 * 빈 행은 건너뜀(xlsx의 sheet_to_json{header:1} 기본 동작과 동일).
 *
 * @param buffer ArrayBuffer 또는 Uint8Array (FileReader.result)
 */
export async function parseSheetToRows(
    buffer: ArrayBuffer | Uint8Array
): Promise<(string | number)[][]> {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    // exceljs 타입 정의는 Node Buffer를 기대하지만 런타임은 Uint8Array/ArrayBuffer도 정상 처리한다.
    // 브라우저(client component)에서는 Buffer가 없으므로 ts-expect-error로 우회.
    // @ts-expect-error -- exceljs Buffer 타입 정의가 브라우저 호환과 충돌
    await workbook.xlsx.load(data);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const rows: (string | number)[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
        // exceljs row.values는 [, v1, v2, ...] 형태 (index 0은 빈 placeholder)
        const values = row.values as unknown[];
        const cells = values.slice(1).map((v): string | number => {
            if (v === null || v === undefined) return "";
            if (typeof v === "number" || typeof v === "string") return v;
            if (v instanceof Date) return v.toISOString();
            // Hyperlink·RichText·Formula 등 object — text/result 필드 우선 추출
            if (typeof v === "object") {
                const obj = v as Record<string, unknown>;
                if ("text" in obj && (typeof obj.text === "string" || typeof obj.text === "number")) {
                    return obj.text as string | number;
                }
                if ("result" in obj && (typeof obj.result === "string" || typeof obj.result === "number")) {
                    return obj.result as string | number;
                }
            }
            return String(v);
        });
        rows.push(cells);
    });
    return rows;
}
