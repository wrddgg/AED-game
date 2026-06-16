import requests, base64, json, sys, os, time

API_KEY = sys.argv[1]
API_URL = "https://www.hfsyapi.cn/v1/images/generations"
IMG_BASE = r"C:\Users\HIT\Desktop\游戏制作\AED-game\demo\assets\images"
REF_DIR = r"C:\Users\HIT\Desktop\游戏制作\三视图"

NOTEXT = " Absolutely no text, no words, no letters, no numbers, no logos, no watermarks, no UI elements anywhere in the image."

def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

scene_ref = encode_image(os.path.join(IMG_BASE, "prologue_rain", "img_01.png"))
print("Loaded: scene anchor")

REF = {}
for name, fname in [("wy","王远三视图.png"),("lxy","林小雨三视图.png"),("lr","倒地老人三视图.png"),("mg","孙建国三视图.png"),("zm","赵雪梅三视图.png"),("cm","陈默三视图.png")]:
    fp = os.path.join(REF_DIR, fname)
    if os.path.exists(fp):
        REF[name] = encode_image(fp)
        print("Loaded ref: " + name)

SC = ("At the same Chinese subway entrance station at night during a typhoon: "
      "glass and steel canopy structure with fluorescent lights, electronic clock showing 21:17, "
      "heavy diagonal rain, typhoon winds, wet pavement reflecting cold blue ambient light "
      "and warm yellow canopy lights, puddles on ground.")

def gen(scene, fname, prompt, refs=None):
    ref_imgs = [scene_ref]
    if refs:
        for r in refs:
            if r in REF: ref_imgs.append(REF[r])
    payload = {"model":"gpt-image-2","prompt":prompt+NOTEXT,"size":"1280x720","n":1,"response_format":"b64_json"}
    if ref_imgs: payload["reference_images"] = ref_imgs
    headers = {"Authorization":"Bearer "+API_KEY,"Content-Type":"application/json"}
    out_dir = os.path.join(IMG_BASE, scene)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, fname)
    if os.path.exists(out_path):
        print("  SKIP: " + scene + "/" + fname); return True
    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=600)
            data = resp.json()
            if resp.status_code != 200:
                print("  ERR " + str(resp.status_code) + ": " + json.dumps(data, ensure_ascii=False)[:200])
                time.sleep(5); continue
            if "data" in data and len(data["data"]) > 0:
                img_data = data["data"][0]
                if "b64_json" in img_data:
                    img_bytes = base64.b64decode(img_data["b64_json"])
                elif "url" in img_data:
                    img_bytes = requests.get(img_data["url"], timeout=60).content
                else:
                    continue
                with open(out_path, "wb") as f: f.write(img_bytes)
                print("  OK: " + scene + "/" + fname + " (" + str(len(img_bytes)) + " bytes)")
                return True
            time.sleep(5)
        except Exception as e:
            print("  ERR: " + str(e)); time.sleep(5)
    print("  FAILED: " + scene + "/" + fname); return False

# ================================================================
# outcome_roll (2 images)
# ================================================================
print("\n=== outcome_roll ===")

gen("outcome_roll", "img_01.png",
    "Wide shot, CPR continuing under the subway canopy. The young passerby in black-framed glasses and dark green jacket still compressing without pause. The rest of the group clustered around watching and helping. Rain on the canopy roof. " + SC,
    ["wy", "lr"])

gen("outcome_roll", "img_02.png",
    "Wide medium shot, the entire group under the canopy with heads turned toward the subway station entrance, the direction Ma Zhiguo ran. The doorway empty and raining. No yellow AED box yet. Anticipation visible through body orientation. " + SC)

# ================================================================
# aed_found_success (5 images) - AED及时回来
# ================================================================
print("\n=== aed_found_success ===")

gen("aed_found_success", "img_01.png",
    "Dynamic wide shot, Ma Zhiguo, 43-year-old Chinese security guard in dark navy uniform, breaking through the edge of the crowd under the subway canopy. Both arms holding a bright yellow AED box against his chest. Shouting for people to make way. Rainwater on his uniform and face. " + SC,
    ["mg"])

gen("aed_found_success", "img_02.png",
    "Medium shot, Ma Zhiguo in dark navy security uniform arriving at the CPR circle with the yellow AED box slick with rainwater. Breathing hard from the sprint. Nearby faces turning toward him. Documentary realism. Under canopy. " + SC,
    ["mg"])

gen("aed_found_success", "img_03.png",
    "Detail shot, Wang Yuan's wet hands in yellow-black delivery jacket carefully placing the yellow AED box on a relatively dry step edge under the canopy, avoiding pooled water. Power button and instructions visible on the AED case. " + SC,
    ["wy"])

gen("aed_found_success", "img_04.png",
    "Wide shot, Sun Jianguo in grey suit holding the phone in speaker mode toward the rescue group. Lin Xiaoyu in light grey hoodie clearing bags and bystanders away from the patient's sides. CPR still continuing in the center. Coordinated civilian rescue under the canopy. " + SC,
    ["lxy", "mg", "lr"])

gen("aed_found_success", "img_05.png",
    "Medium wide shot, the rescue team arranged around the elderly patient with the opened yellow AED box now on the ground. Sun Jianguo in grey suit holding the speakerphone while everyone listens and continues the workflow. Calm but urgent medical realism under the canopy. " + SC,
    ["mg", "lr"])

# ================================================================
# aed_clear_space (3 images) - AED交互
# ================================================================
print("\n=== aed_clear_space ===")

gen("aed_clear_space", "img_01.png",
    "Action close shot, Wang Yuan in yellow-black delivery jacket opening the elderly man's chest clothing while Lin Xiaoyu in light grey hoodie dries the pad-contact areas with cloth. The open yellow AED case beside them on the ground. Coordinated civilian emergency care under the canopy. " + SC,
    ["wy", "lxy", "lr"])

gen("aed_clear_space", "img_02.png",
    "Technical close shot, AED pads being placed correctly on the elderly patient's upper right chest below the clavicle and lower left chest. Chest surface dried. The pads are white adhesive. Precise placement. Under canopy fluorescent light. " + SC,
    ["lr"])

gen("aed_clear_space", "img_03.png",
    "Medium shot, the rescue group gathered tightly around the patient under the canopy. Sun Jianguo in grey suit holding the speakerphone. The open yellow AED powered on beside the patient. Everyone following instructions, not moving randomly. Rain outside. " + SC,
    ["mg", "lr"])

# ================================================================
# aed_execute (7 images) - 按提示执行
# ================================================================
print("\n=== aed_execute ===")

gen("aed_execute", "img_01.png",
    "Wide shot, everyone around the elderly patient stepping back under the canopy, hands clearly away from the body. The yellow AED placed on the ground beside the patient, open and active with indicator lights. Rain outside. " + SC,
    ["lr"])

gen("aed_execute", "img_02.png",
    "Close-up of the yellow AED device with indicator lights blinking, analysis in progress. The screen showing a waveform. Rain-dark environment around the machine. Under the canopy. " + SC)

gen("aed_execute", "img_03.png",
    "Close shot of the AED display now indicating shock advised, a flashing orange shock button visible. Rescuers blurred in the background still standing clear. Under canopy. " + SC)

gen("aed_execute", "img_04.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket spreading both arms and shouting the final safety warning. Everyone behind him visibly keeping distance from the patient. Under the canopy. " + SC,
    ["wy"])

gen("aed_execute", "img_05.png",
    "Wide shot capturing the exact defibrillation moment. The patient's body showing only a brief subtle jolt. The team watching in silence. Realism emphasized over drama. Under the canopy. Rain. " + SC,
    ["lr"])

gen("aed_execute", "img_06.png",
    "Close-up of the AED screen after shock delivery, now instructing the team to continue CPR. Device calm and authoritative. Yellow casing. Under canopy light. " + SC)

gen("aed_execute", "img_07.png",
    "Action shot, the young passerby in black-framed glasses and dark green jacket immediately resuming chest compressions while Wang Yuan in yellow-black jacket watches the arm position and rhythm closely from beside him. Compressions continuing without delay. Under canopy. " + SC,
    ["wy", "lr"])

# ================================================================
# aed_delay_bad (6 images) - AED迟迟没回来
# ================================================================
print("\n=== aed_delay_bad ===")

gen("aed_delay_bad", "img_01.png",
    "Wide shot from under the canopy toward the subway station entrance, the doorway still empty except for rain and reflected fluorescent light. No security guard and no yellow AED box in sight. Cold blue tone. " + SC)

gen("aed_delay_bad", "img_02.png",
    "POV shot toward the station interior. Blurred commuters and passersby moving across a wet floor under harsh station lights. No security guard running back. The search ending in disappointment. " + SC)

gen("aed_delay_bad", "img_03.png",
    "Medium shot, the speakerphone held near the rescuers while rain noise dominates. Nearby faces straining to hear instructions. Fragmented station background beyond the rain curtain. Grounded realism. Under canopy. " + SC,
    ["lr"])

gen("aed_delay_bad", "img_04.png",
    "Medium overhead shot, Wang Yuan in yellow-black delivery jacket and the young passerby in dark green jacket staying locked into the CPR rhythm. Heads down, shoulders tense. Refusing to stop. Wet ground and kneeling positions clearly visible. Under canopy. " + SC,
    ["wy"])

gen("aed_delay_bad", "img_05.png",
    "Medium shot, Lin Xiaoyu in light grey hoodie shouting encouragement from beside the patient. Rain on her hair and face. Urgency without panic. Her body turned toward the compressions rather than the station entrance. Under canopy. " + SC,
    ["lxy"])

gen("aed_delay_bad", "img_06.png",
    "Wide shot of the whole rescue circle under the canopy after time has clearly passed. Positions subtly changed, a different rescuer now taking over compressions while others remain exhausted and wet. The station entrance still empty. Prolonged waiting visible through physical fatigue. " + SC,
    ["wy", "lr"])

# ================================================================
# heartbeat_return (8 images) - 微弱心跳
# ================================================================
print("\n=== heartbeat_return ===")

gen("heartbeat_return", "img_01.png",
    "Wide exterior shot, an ambulance arriving through heavy rain outside the subway entrance, headlights and emergency lights cutting through the storm. Wet street reflecting red and blue. " + SC)

gen("heartbeat_return", "img_02.png",
    "Action shot, Dr. Chen Mo, a tall thin Chinese man in dark green medical uniform with gold-rimmed glasses, and a nurse rushing under the canopy with a stretcher and equipment. Civilian rescuers stepping aside. Urgent but orderly movement. Rain. " + SC,
    ["cm"])

gen("heartbeat_return", "img_03.png",
    "Close shot, a portable monitor beside the patient showing a weak but organized rhythm waveform. Dr. Chen Mo in dark green uniform and gold-rimmed glasses looking closely at the waveform, leaning in to verify. Under canopy. " + SC,
    ["cm", "lr"])

gen("heartbeat_return", "img_04.png",
    "Medium shot, Dr. Chen Mo in dark green medical uniform and gold-rimmed glasses speaking calmly while facing the rescue team. One hand near the monitor and the other directing transport preparation. Hope conveyed through professionalism. Under canopy. " + SC,
    ["cm"])

gen("heartbeat_return", "img_05.png",
    "Close-up of Zhao Xuemei's face, a 48-year-old Chinese woman in dark purple down jacket. Crying stopping abruptly and turning into a quieter trembling sob. Rain and tears mixed. Fragile relief replacing panic. Under canopy light. " + SC,
    ["zm"])

gen("heartbeat_return", "img_06.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket stepping back to the edge of the canopy and looking down at his own trembling hands for the first time. Adrenaline crash and exhaustion visible. Rain. " + SC,
    ["wy"])

gen("heartbeat_return", "img_07.png",
    "Close-up of Wang Yuan's phone screen in his wet hand in yellow-black sleeve. The delivery app showing a red overtime warning. Raindrops on the glass. The everyday consequence of delaying work to save a life. Under canopy. " + SC,
    ["wy"])

gen("heartbeat_return", "img_08.png",
    "Medium shot, Wang Yuan in yellow-black jacket holding the phone but looking past it toward the patient being loaded for transport. The red overtime screen ignored. Attention stays on the rescue outcome. Under canopy. " + SC,
    ["wy"])

# ================================================================
# aed_map (5 images) - 城市AED地图
# ================================================================
print("\n=== aed_map ===")

gen("aed_map", "img_01.png",
    "High-angle transition shot, the rainy subway entrance scene receding upward into a broader nighttime view of surrounding city blocks. Wet roads and a few emergency lights still visible below. Restrained documentary transition. Cinematic. 16:9.")

gen("aed_map", "img_02.png",
    "Clean minimalist city map graphic of a Chinese city named Linjiang on a dark black background. Thin cool-blue district and road lines. Elegant design. Public-information style, not sci-fi. No text or words anywhere. 16:9.")

gen("aed_map", "img_03.png",
    "Same minimalist dark city map. One amber glowing point lighting up at a subway station location. Clear and simple emphasis. The only warm accent in the dark frame. No text. 16:9.")

gen("aed_map", "img_04.png",
    "The city map now showing muted grey coverage-gap zones clearly marked across districts. A single amber point contrasted against them. Public-health visualization style. Dark background. No text. 16:9.")

gen("aed_map", "img_05.png",
    "The same city map with grey zones highlighted and distance indicators showing coverage gaps. Sober policy-brief visual language. Dark background with cool blue and grey tones. No text anywhere. 16:9.")

# ================================================================
# chapter_review (1 image)
# ================================================================
print("\n=== chapter_review ===")

gen("chapter_review", "img_01.png",
    "Dark minimalist graphic design, a chapter review screen for a rescue game. Gold accent elements at the top, rescue metric numbers on the left side, outcome summary areas on the right. Clean sans-serif design with amber and cool blue accent colors on pure black background. Information design style. No text, no words, no letters. 16:9.")

print("\n=== ALL PARTS COMPLETE ===")
print("Total: prologue_rain(9) + choice_1(3) + enter_circle(5) + film_first(4) + check_response(6)")
print("  + start_cpr(4) + wait_breath(6) + kneel_down(5) + cpr_first_push(4) + scam_whisper(5)")
print("  + name_witness(8) + crowd_film(6) + cpr_rhythm(7) + cpr_fatigue(3)")
print("  + let_others(4) + keep_going(10) + family_accuse_handoff(12) + family_accuse(6)")
print("  + kept_working(6) + stop_explain(6) + bad_ending(8) + outcome_roll(2)")
print("  + aed_found_success(5) + aed_clear_space(3) + aed_execute(7) + aed_delay_bad(6)")
print("  + heartbeat_return(8) + aed_map(5) + chapter_review(1)")
print("  = 167 images total")
