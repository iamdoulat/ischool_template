import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/v1/examination/print-marksheet/criteria', {
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log("Success! Data:");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Error:", e.response ? e.response.status : e.message);
        if (e.response) {
            console.error(e.response.data);
        }
    }
}
test();
