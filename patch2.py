import re

file_path = 'src/app/dashboard/fees-collection/search-fees-payment/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    'import { useTranslateToast } from "@/hooks/use-translate-toast";',
    'import { useTranslateToast } from "@/hooks/use-translate-toast";\nimport { useCurrencyFormatter } from "@/hooks/use-currency-formatter";'
)

# Add hook inside SearchFeesPaymentPage
content = content.replace(
    'const { toast } = useTranslateToast();',
    'const { toast } = useTranslateToast();\n    const { symbol } = useCurrencyFormatter();'
)

# Fix .toFixed and $ issues
content = content.replace(
    '',
    '{symbol}{Number(payment.amount).toFixed(2)}'
)
content = content.replace(
    '-',
    '-{symbol}{Number(payment.discount).toFixed(2)}'
)
content = content.replace(
    '+',
    '+{symbol}{Number(payment.fine).toFixed(2)}'
)
content = content.replace(
    '',
    '{symbol}{(Number(payment.amount) - Number(payment.discount) + Number(payment.fine)).toFixed(2)}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
