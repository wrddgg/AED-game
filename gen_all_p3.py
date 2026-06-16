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
# family_accuse_handoff (12 images) - 已交接版
# ================================================================
print("\n=== family_accuse_handoff ===")

gen("family_accuse_handoff", "img_01.png",
    "Medium shot, Zhao Xuemei, a 48-year-old Chinese woman in a dark purple down jacket with puffy wet eyes and wet hair, pushing through the outer edge of the crowd in panic. She holds a folded blue umbrella. Not yet fully seeing the scene. Rain. Under the subway canopy. " + SC,
    ["zm"])

gen("family_accuse_handoff", "img_02.png",
    "POV shot through a gap in the crowd. A woman sees a fallen electric delivery scooter outside the canopy in the rain. Yellow delivery box visible. " + SC)

gen("family_accuse_handoff", "img_03.png",
    "Detail shot, a yellow delivery box tipped on its side at the edge of a puddle, rain striking the plastic surface. The detail that feeds a wrong assumption. " + SC)

gen("family_accuse_handoff", "img_04.png",
    "Medium shot, Zhao Xuemei in dark purple down jacket pushing past shoulders and umbrellas, finally getting a direct view of an elderly man lying on the ground under the canopy. Shock beginning. " + SC,
    ["zm", "lr"])

gen("family_accuse_handoff", "img_05.png",
    "Close-up of Zhao Xuemei's face, a 48-year-old Chinese woman in dark purple down jacket. Color draining away in shock, mouth opening, eyes fixed on the collapsed elderly man. Rain on her face. Under canopy light. " + SC,
    ["zm"])

gen("family_accuse_handoff", "img_06.png",
    "Wide shot from Zhao Xuemei's perspective: a young passerby in black-framed glasses and dark green jacket kneeling and doing CPR on the elderly man. Wang Yuan in yellow-black delivery jacket standing behind the passerby bent over, closely monitoring the technique. Under the canopy. " + SC,
    ["wy"])

gen("family_accuse_handoff", "img_07.png",
    "Close detail shot in one frame: the elderly man's left wrist on wet ground with a soaked red string bracelet, and Zhao Xuemei's own wrist entering frame with an identical red string. Family connection made visible. Canopy light. " + SC,
    ["lr", "zm"])

gen("family_accuse_handoff", "img_08.png",
    "Intense close-up of Zhao Xuemei in dark purple down jacket shouting in grief and disbelief. Rain and tears on her face. Body leaning forward toward the rescuers. Under the canopy. " + SC,
    ["zm"])

gen("family_accuse_handoff", "img_09.png",
    "Medium shot, Zhao Xuemei in dark purple jacket pointing accusingly toward Wang Yuan in yellow-black delivery jacket while the rescue continues behind him. Raw fear transformed into blame. Under the canopy. " + SC,
    ["zm", "wy"])

gen("family_accuse_handoff", "img_10.png",
    "Detail shot, the young passerby's shoulders in dark green jacket visibly flinching at the accusation while his hands continue CPR compressions on the elderly man without stopping. Under the canopy. " + SC,
    ["lr"])

gen("family_accuse_handoff", "img_11.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket staying in place behind the passerby in dark green jacket, one hand steadying the rescuer's shoulder. Refusing to retreat or argue. Focus still on the rescue. Under the canopy. " + SC,
    ["wy"])

gen("family_accuse_handoff", "img_12.png",
    "Close medium shot, Wang Yuan in yellow-black jacket leaning in toward the young passerby in dark green jacket and speaking low but firmly, grounding him so the compressions keep going despite the chaos. Under the canopy. " + SC,
    ["wy"])

# ================================================================
# family_accuse (6 images) - 自己按压版
# ================================================================
print("\n=== family_accuse ===")

gen("family_accuse", "img_01.png",
    "Medium shot, Zhao Xuemei, 48-year-old Chinese woman in dark purple down jacket with puffy wet eyes, pushing through the crowd edge in the rain with a folded blue umbrella. Panic on her face. Foreground canopy lights. " + SC,
    ["zm"])

gen("family_accuse", "img_02.png",
    "Detail, a yellow delivery box tipped at the edge of a puddle, rain on the plastic surface. The detail that starts her wrong assumption. " + SC)

gen("family_accuse", "img_03.png",
    "POV shot through the crowd, Zhao Xuemei sees Wang Yuan in yellow-black delivery jacket with dark complexion and short crew cut kneeling and pressing on the elderly man's chest. The moment of recognition. Under canopy light. " + SC,
    ["wy", "lr", "zm"])

gen("family_accuse", "img_04.png",
    "Detail close-up of the elderly man's left wrist on wet ground with a soaked red string bracelet, identical to the one on Zhao Xuemei's own wrist. Warm canopy light. " + SC,
    ["lr", "zm"])

gen("family_accuse", "img_05.png",
    "Dramatic two-shot: Zhao Xuemei in dark purple down jacket grabbing Wang Yuan's yellow-black delivery jacket from the left side, face twisted with fury and fear. Wang Yuan's upper body swaying but hands still locked on the elderly man's chest. Subway canopy light. Rain. " + SC,
    ["zm", "wy", "lr"])

gen("family_accuse", "img_06.png",
    "Close-up of Wang Yuan's face in yellow-black delivery jacket, shouting while being grabbed. Lips trembling but words held. Restrained but urgent. Canopy fluorescent light. " + SC,
    ["wy"])

# ================================================================
# kept_working (6 images)
# ================================================================
print("\n=== kept_working ===")

gen("kept_working", "img_01.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket with dark complexion stepping between Zhao Xuemei in dark purple down jacket and the elderly patient. One wet hand raised in a stop gesture while CPR continues just behind him. Expression urgent but controlled. Crowded subway canopy at night. " + SC,
    ["wy", "zm", "lr"])

gen("kept_working", "img_02.png",
    "Medium shot, Lin Xiaoyu, 19-year-old Chinese woman with low ponytail, silver-rimmed glasses and light grey hoodie, stepping forward from the crowd line. Nursing intern ID visible on her chest. Speaking quickly and firmly toward Zhao Xuemei. One hand indicating the ongoing compressions. Rain on her hair and face. " + SC,
    ["lxy", "zm"])

gen("kept_working", "img_03.png",
    "Medium shot, Sun Jianguo, 45-year-old Chinese man in grey suit and gold-rimmed reading glasses, holding up the smartphone with the active 120 call still on speaker. Free hand gesturing as corroboration. Phone becoming evidence in the middle of the conflict. Under canopy. " + SC,
    ["mg"])

gen("kept_working", "img_04.png",
    "Close-up of Zhao Xuemei's hands unclenching after moments of accusation, fingers slowly loosening in the rain. Anger giving way to shock and dawning understanding. Canopy light. " + SC,
    ["zm"])

gen("kept_working", "img_05.png",
    "Over-the-shoulder shot from Zhao Xuemei's perspective in dark purple jacket, seeing Wang Yuan soaked through in yellow-black delivery jacket and the young passerby in dark green jacket still kneeling and compressing without stopping. Her perception beginning to change. Under canopy. " + SC,
    ["zm", "wy"])

gen("kept_working", "img_06.png",
    "Wide shot, the rescue group functioning as one unit under the canopy. Compressions ongoing by the passerby in dark green jacket. Wang Yuan in yellow-black jacket supervising. Lin Xiaoyu in light grey hoodie assisting. Sun Jianguo in grey suit holding phone. Zhao Xuemei in dark purple jacket standing close but no longer resisting. Cold rain all around. " + SC,
    ["wy", "lxy", "mg", "zm"])

# ================================================================
# stop_explain (6 images) - 致命的24秒
# ================================================================
print("\n=== stop_explain ===")

gen("stop_explain", "img_01.png",
    "Medium close shot, Wang Yuan in yellow-black delivery jacket, hands lifted from the elderly man's chest raised in a defensive gesture, body turned toward Zhao Xuemei in dark purple jacket. The patient's chest still and empty of hands in the center. Tense pause. Under canopy. " + SC,
    ["wy", "zm", "lr"])

gen("stop_explain", "img_02.png",
    "Close-up of Zhao Xuemei's face in dark purple down jacket, staring at Wang Yuan. Tears on her face. Confusion and accusation. Canopy light. Rain. " + SC,
    ["zm"])

gen("stop_explain", "img_03.png",
    "Detail close-up of the elderly man's still chest in dark blue clothing on wet ground under warm canopy light. No movement, no hands on the chest. The stillness of interrupted life. " + SC,
    ["lr"])

gen("stop_explain", "img_04.png",
    "Medium shot, Wang Yuan in yellow-black jacket snapping back to reality and dropping back to his knees, hands reaching back toward the patient's chest. Decisive return to action. Rain behind. Under canopy. " + SC,
    ["wy", "lr"])

gen("stop_explain", "img_05.png",
    "Dynamic medium shot, Ma Zhiguo, a 43-year-old Chinese security guard in dark navy uniform, sprinting back under the canopy with a bright yellow AED box. Seeing the confrontation and freshly resumed compressions. Placing the AED on a step edge. Sweating and wet from rain. " + SC,
    ["mg"])

gen("stop_explain", "img_06.png",
    "Wide shot, the bright yellow AED box arriving like a shock that halts the argument. Everyone's attention turning to it. Canopy interior and exterior contrast. Rain. " + SC)

# ================================================================
# bad_ending (8 images) - 迟到的代价
# ================================================================
print("\n=== bad_ending ===")

gen("bad_ending", "img_01.png",
    "Wide shot, ambulance lights washing over the subway canopy as Dr. Chen Mo and a nurse rush in with a stretcher and equipment. Civilian rescuers making space immediately. Rain and wet tiles everywhere. Red and blue emergency lights. " + SC,
    ["cm"])

gen("bad_ending", "img_02.png",
    "Close shot, hands still performing compressions while a portable monitor is attached beside the patient. Wet cables. Urgent but orderly transfer from civilian rescue to professional care. Under canopy. " + SC,
    ["lr"])

gen("bad_ending", "img_03.png",
    "Medium shot, Dr. Chen Mo, a tall thin Chinese man in dark green medical uniform with gold-rimmed glasses, giving firm transport instructions while directing the team around the stretcher. Face composed. Hands signaling coordinated movement. Under canopy. " + SC,
    ["cm"])

gen("bad_ending", "img_04.png",
    "Wide shot, the elderly patient being lifted onto the stretcher while compressions continue. No visible sign of recovery in the team's expressions. Rain-heavy realism. Under canopy. " + SC,
    ["lr"])

gen("bad_ending", "img_05.png",
    "Medium tracking shot, Zhao Xuemei in dark purple down jacket following the moving stretcher into the rain, one hand gripping her red string bracelet tightly. Face stunned and desperate. Red and blue ambulance lights. " + SC,
    ["zm"])

gen("bad_ending", "img_06.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket standing alone at the edge of the canopy after the stretcher has moved away. Soaked delivery jacket dripping, shoulders collapsed from exhaustion. Watching in silence. " + SC,
    ["wy"])

gen("bad_ending", "img_07.png",
    "Detail shot, the fallen electric delivery scooter in pooled rainwater. Nearby phone screen glowing red with an overtime delivery warning. Raindrops hitting both surfaces. The everyday cost beside catastrophe. " + SC)

gen("bad_ending", "img_08.png",
    "Wide final shot, the ambulance leaving into the rainy night while the now-emptier subway canopy remains behind. The rescue area marked only by wet ground and scattered traces. The absence of the AED felt through what never arrived in time. " + SC)

print("\n=== Part 3 done (family_accuse through bad_ending) ===")
