import re

file_path = 'src/app/dashboard/fees-collection/search-fees-payment/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { useState } from "react";',
    'import { useState, useRef } from "react";\nimport html2canvas from "html2canvas";\nimport jsPDF from "jspdf";\nimport Link from "next/link";'
)

# 2. Interface update
content = content.replace(
    '            admission_no: string;\n            school_class: { class: string };\n            section: { section: string };',
    '            id: number;\n            admission_no: string;\n            school_class: { name: string };\n            section: { name: string };'
)

# 3. Add hooks and handlers
handlers = '''    const { symbol } = useCurrencyFormatter();
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handlePDF = async (paymentId: string | number) => {
        if (!receiptRef.current) return;
        
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(Payment_Receipt_.pdf);
        } catch (error) {
            console.error("PDF generation failed", error);
            toast("error", t("failed_to_generate_pdf"));
        }
    };'''

content = content.replace(
    '    const { symbol } = useCurrencyFormatter();',
    handlers
)

# 4. no-print classes
content = content.replace(
    '<div className="flex justify-between items-center mb-6">',
    '<div className="flex justify-between items-center mb-6 no-print">'
)

content = content.replace(
    '<Card className="mb-8 border-[0.5px] border-gray-300 shadow-sm">',
    '<Card className="mb-8 border-[0.5px] border-gray-300 shadow-sm no-print">'
)

content = content.replace(
    '<div className="space-y-6">',
    '<div className="space-y-6 no-print">'
)

# 5. Receipt Ref
content = content.replace(
    '{results.map((payment) => (\\n                        <Card key={payment.id}',
    '{results.map((payment) => (\\n                        <Card key={payment.id} innerRef={receiptRef}'
)

# Actually innerRef might not be standard on Card, so we wrap it in a div:
content = content.replace(
    '{results.map((payment) => (\\n                        <Card key={payment.id} className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-lg relative">',
    '{results.map((payment) => (\\n                        <div key={payment.id} className="lg:col-span-2" ref={receiptRef}>\\n                        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-lg relative">'
)
content = content.replace(
    '</Card>\\n                    ))} ',
    '</Card>\\n                        </div>\\n                    ))} '
)
content = content.replace(
    '</Card>\\n                    ))}',
    '</Card>\\n                        </div>\\n                    ))}'
)


# 6. Buttons
content = content.replace(
    '<Button variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">\\n                                        <Printer className="h-3.5 w-3.5 mr-2" /> {t("print")}\\n                                    </Button>',
    '<Button onClick={handlePrint} variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10 no-print">\\n                                        <Printer className="h-3.5 w-3.5 mr-2" /> {t("print")}\\n                                    </Button>'
)
content = content.replace(
    '<Button variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">\\n                                        <Download className="h-3.5 w-3.5 mr-2" /> {t("pdf")}\\n                                    </Button>',
    '<Button onClick={() => handlePDF(payment.id)} variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10 no-print">\\n                                        <Download className="h-3.5 w-3.5 mr-2" /> {t("pdf")}\\n                                    </Button>'
)

# 7. Class and Section fix
content = content.replace(
    '{payment.student_fee_master.student.school_class.class} ({payment.student_fee_master.student.section.section})',
    '{payment.student_fee_master.student.school_class?.name || "N/A"} ({payment.student_fee_master.student.section?.name || "N/A"})'
)

# 8. Action links
old_action_links = '''                            <CardContent className="p-6 space-y-3">
                                <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Eye className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_student_profile")}
                                </Button>
                                <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_all_student_fees")}
                                </Button>
                            </CardContent>'''

new_action_links = '''                            <CardContent className="p-6 space-y-3">
                                {results.length > 0 && (
                                    <>
                                        <Link href={/dashboard/student-information/student-details/} passHref>
                                            <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group mb-2">
                                                <Eye className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_student_profile")}
                                            </Button>
                                        </Link>
                                        <Link href={/dashboard/fees-collection/collect-fees?student_id=} passHref>
                                            <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                                <Calendar className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_all_student_fees")}
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </CardContent>'''

content = content.replace(old_action_links, new_action_links)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
