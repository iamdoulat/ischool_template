import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/v1/examination/exam-types', {
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log("Exam Types Response:", JSON.stringify(res.data, null, 2));

        const res2 = await axios.get('http://127.0.0.1:8000/api/v1/examination/exam-groups', {
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log("Exam Groups Response:", JSON.stringify(res2.data, null, 2));
    } catch (e) {
        console.error("Error:", e.response ? e.response.status : e.message);
        if (e.response) {
            console.error(e.response.data);
        }
    }
}
test();
