<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\QrAttendanceSetting;
use Illuminate\Support\Facades\Log;

class QrAttendanceSettingController extends Controller
{
    public function index()
    {
        return response()->json(QrAttendanceSetting::first());
    }

    public function update(Request $request)
    {
        $setting = QrAttendanceSetting::first();
        if (!$setting) {
            $setting = new QrAttendanceSetting();
        }
        
        $setting->update($request->all());
        
        return response()->json(['message' => 'QR Attendance settings updated successfully', 'data' => $setting]);
    }

    public function discoverCameras(Request $request)
    {
        $request->validate([
            'subnet' => 'required|string|max:15',
        ]);

        $subnet = $request->input('subnet');
        $ports = [80, 8080, 81];
        $timeout = 2;
        $cameras = [];
        $brandPatterns = [
            '/hikvision/i' => 'hikvision',
            '/dahua/i' => 'dahua',
            '/foscam/i' => 'foscam',
            '/tp-link|tplink|vigii/i' => 'tplink',
            '/zksoftware|zkt eco|zkteco/i' => 'zk',
            '/esp32|esp-cam/i' => 'esp32cam',
            '/onvif/i' => 'onvif',
            '/hichip/i' => 'hikvision',
            '/xunter/i' => 'hikvision',
        ];

        $mcurl = curl_multi_init();
        $handles = [];

        for ($ipSuffix = 1; $ipSuffix <= 254; $ipSuffix++) {
            $ip = "$subnet.$ipSuffix";
            foreach ($ports as $port) {
                $url = "http://$ip:$port";
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => $timeout,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_NOBODY => true,
                    CURLOPT_HEADER => true,
                    CURLOPT_FOLLOWLOCATION => false,
                ]);
                curl_multi_add_handle($mcurl, $ch);
                $handles[] = ['handle' => $ch, 'ip' => $ip, 'port' => $port, 'url' => $url];
            }
        }

        $running = null;
        do {
            curl_multi_exec($mcurl, $running);
            curl_multi_select($mcurl, 1);
        } while ($running > 0);

        foreach ($handles as $item) {
            $response = curl_multi_getcontent($item['handle']);
            $info = curl_getinfo($item['handle']);
            $httpCode = $info['http_code'];

            if ($httpCode > 0 && $httpCode < 500) {
                $headers = $response ? explode("\r\n", $response) : [];
                $detectedBrand = 'generic';

                foreach ($headers as $header) {
                    foreach ($brandPatterns as $pattern => $brand) {
                        if (preg_match($pattern, $header)) {
                            $detectedBrand = $brand;
                            break 2;
                        }
                    }
                }

                if ($httpCode === 401 && isset($info['redirect_url'])) {
                    foreach ($brandPatterns as $pattern => $brand) {
                        if (preg_match($pattern, $info['redirect_url'])) {
                            $detectedBrand = $brand;
                            break;
                        }
                    }
                }

                $cameras[] = [
                    'ip' => $item['ip'],
                    'port' => $item['port'],
                    'url' => $item['url'],
                    'http_code' => $httpCode,
                    'brand' => $detectedBrand,
                    'name' => $detectedBrand === 'generic' ? "Camera ({$item['ip']}:{$item['port']})" : ucfirst($detectedBrand) . " ({$item['ip']}:{$item['port']})",
                ];
            }

            curl_multi_remove_handle($mcurl, $item['handle']);
            curl_close($item['handle']);
        }

        curl_multi_close($mcurl);

        return response()->json([
            'success' => true,
            'data' => $cameras,
            'message' => count($cameras) . ' camera(s) discovered',
        ]);
    }
}
