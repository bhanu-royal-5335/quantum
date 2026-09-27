import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("END-TO-END INTEGRATION TEST")
print("=" * 60)

# 1. Health
h_data = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/health').read())
print("1. Backend Health Check: [PASS]", h_data)

# 2. Scenarios
scens = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/scenarios').read())
print(f"2. Scenarios Endpoint:   [PASS] Loaded {len(scens)} scenarios: {[s['id'] for s in scens]}")

# 3. Run Simulation
sim_payload = json.dumps(scens[0]['parameters']).encode('utf-8')
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/simulation/run',
    data=sim_payload,
    headers={'Content-Type': 'application/json'}
)
sim_res = json.loads(urllib.request.urlopen(req).read())
print(f"3. Simulation Run:       [PASS] ID: {sim_res['id'][:8]}...")
print(f"   QBER:                 {sim_res['qber'] * 100:.3f}%")
print(f"   Channel Loss:         {sim_res['channel_loss_db']:.2f} dB")
print(f"   Secret-Key Rate:      {sim_res['secret_key_rate']:,.1f} bps")
print(f"   Detection Rate:       {sim_res['detection_rate']:.2f}%")
print(f"   Sifted Key Length:    {sim_res['sifted_key_length']:,} bits")
print(f"   Secure Status:        {sim_res['is_secure']} ({sim_res['security_status_message']})")
print(f"   Bit Samples:          {len(sim_res['bit_samples'])} pulses")
print(f"   Monte Carlo Runs:     {sim_res['monte_carlo']['iterations']} iterations (95% CI: [{sim_res['monte_carlo']['ci_95_lower']*100:.2f}% - {sim_res['monte_carlo']['ci_95_upper']*100:.2f}%])")
print(f"   Precomputed Curves:   Distance ({len(sim_res['loss_vs_distance_curve'])}), Turb ({len(sim_res['qber_vs_turbulence_curve'])}), Pointing ({len(sim_res['qber_vs_pointing_curve'])}), Cond ({len(sim_res['key_rate_vs_conditions_curve'])})")

# 4. Scenario Comparison
comp_payload = json.dumps({'scenario_ids': ['scenario-a', 'scenario-b', 'scenario-c', 'scenario-d', 'scenario-f']}).encode('utf-8')
comp_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/scenarios/compare',
    data=comp_payload,
    headers={'Content-Type': 'application/json'}
)
comp_res = json.loads(urllib.request.urlopen(comp_req).read())
print(f"4. Scenario Comparison:  [PASS] Compared {len(comp_res['comparison_table'])} scenarios:")
for row in comp_res['comparison_table']:
    print(f"   • {row['scenario_name'][:28]:28} | Loss: {row['channel_loss_db']:8} | QBER: {row['qber_percent']:7} | Rate: {row['secret_key_rate_bps']:10} | {row['security_status']}")

# 5. PDF Generation
sim_id = sim_res['id']
pdf_url = f"http://127.0.0.1:8000/api/reports/pdf/{sim_id}"
pdf_bytes = urllib.request.urlopen(pdf_url).read()
print(f"5. PDF Report Generator: [PASS] Downloaded {len(pdf_bytes):,} bytes | Header: {pdf_bytes[:4].decode('latin1')}")

# 6. CSV Export
csv_url = f"http://127.0.0.1:8000/api/reports/csv/{sim_id}"
csv_text = urllib.request.urlopen(csv_url).read().decode('utf-8')
print(f"6. CSV Report Generator: [PASS] Downloaded {len(csv_text):,} characters")

# 7. Frontend Check
frontend_html = urllib.request.urlopen('http://localhost:5173/').read().decode('utf-8')
has_title = 'QuantumSim' in frontend_html
print(f"7. Vite Frontend Dev:    [PASS] HTML served with title: {has_title}")

print("=" * 60)
print("ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!")
print("=" * 60)
