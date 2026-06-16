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
# name_witness (8 images)
# ================================================================
print("\n=== name_witness ===")

gen("name_witness", "img_01.png",
    "Medium shot, Wang Yuan, a young Chinese man with dark complexion and short crew cut in yellow-black Meituan delivery rain jacket, kneeling beside the elderly man while doing CPR. One hand still positioned for compressions, the other hand pointing directly at a specific bystander. Wet hair stuck to forehead. Urgent eye contact. Rain outside canopy. " + SC,
    ["wy", "lr"])

gen("name_witness", "img_02.png",
    "Medium shot, Lin Xiaoyu, a 19-year-old Chinese woman with low ponytail, silver-rimmed glasses and light grey hoodie, finally squeezing out from the crowd. Raising her smartphone with an active emergency call to 120. Expression breaking from hesitation into action. Rainwater on her clothing. Under the subway canopy. " + SC,
    ["lxy"])

gen("name_witness", "img_03.png",
    "Wide shot, Lin Xiaoyu in light grey hoodie stepping past the front row of bystanders into the rescue circle. Crowd parting slightly around her. Body language shifting from frozen observer to active helper. Wet anti-slip tiles. Rain streaks outside canopy. " + SC,
    ["lxy"])

gen("name_witness", "img_04.png",
    "Close-up of Lin Xiaoyu's smartphone screen in her wet hand, emergency call interface showing 120 connected and timer counting upward. Raindrops on the glass. Shallow depth of field. Realistic phone display. " + SC,
    ["lxy"])

gen("name_witness", "img_05.png",
    "Medium shot, Sun Jianguo, a 45-year-old Chinese man in a damp grey suit with gold-rimmed reading glasses and graying temples, taking the phone from Lin Xiaoyu. Thumb pressing the speaker button. Expression changing from confusion to acceptance of responsibility. Under the subway canopy in rain. " + SC,
    ["mg"])

gen("name_witness", "img_06.png",
    "Close-up, Sun Jianguo, a 45-year-old man in grey suit and gold-rimmed reading glasses, holding the phone with speaker mode enabled near chest height. Background rain blurred into streaks. Nearby faces turning toward the phone to listen. Under canopy. " + SC,
    ["mg"])

gen("name_witness", "img_07.png",
    "Medium shot from slightly above, Wang Yuan in yellow-black delivery jacket still maintaining compression rhythm on the elderly man while lifting his head to shout the next instruction. Jaw tense, soaked delivery jacket. Crowd watching for orders. Under canopy. " + SC,
    ["wy", "lr"])

gen("name_witness", "img_08.png",
    "Wide shot, Wang Yuan in yellow-black jacket shouting while pointing toward the subway security checkpoint direction. Ma Zhiguo, a 43-year-old security guard in dark navy uniform, turning sharply toward the station interior after hearing the AED instruction. Documentary realism. Under the canopy. " + SC,
    ["wy", "mg"])

# ================================================================
# crowd_film (6 images)
# ================================================================
print("\n=== crowd_film ===")

gen("crowd_film", "img_01.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket looking up from CPR toward the crowd. One hand gesturing outward asking someone to film the wider scene. Urgency on his face. Under the subway canopy in rain. " + SC,
    ["wy"])

gen("crowd_film", "img_02.png",
    "Wide medium shot of part of the crowd under the canopy. A young Chinese woman raising her phone to start recording while an older man next to her frowns with disapproval. Two contrasting reactions in one frame. Rain. " + SC)

gen("crowd_film", "img_03.png",
    "Close-up of a Chinese woman's face in the crowd, eyebrows furrowed in judgment, mouth forming disapproving expression. Rain on her umbrella brim. Social scrutiny. Under the canopy. " + SC)

gen("crowd_film", "img_04.png",
    "Close-up of a young Chinese man smirking skeptically, phone already out filming. Cynical expression. Under the rainy canopy. " + SC)

gen("crowd_film", "img_05.png",
    "Medium shot of a pragmatic-looking middle-aged Chinese person, nodding while raising phone to record. Expression of worldly caution. Rain on shoulders. Under the canopy. " + SC)

gen("crowd_film", "img_06.png",
    "Close-up of Wang Yuan's focused face from the side in yellow-black delivery jacket. Choosing not to engage with the crowd. Hands continuing compressions on the elderly patient. Eyes fixed on the patient. Under the canopy. " + SC,
    ["wy", "lr"])

# ================================================================
# cpr_rhythm (7 images)
# ================================================================
print("\n=== cpr_rhythm ===")

gen("cpr_rhythm", "img_01.png",
    "Wide shot, three layers of action under the subway canopy. Foreground: Wang Yuan in yellow-black delivery jacket performing CPR on the elderly man. Midground: Sun Jianguo in grey suit holding phone on speaker. Background: Ma Zhiguo in dark navy security uniform running through the station entrance. Rain connecting all three layers. " + SC,
    ["wy", "mg", "lr"])

gen("cpr_rhythm", "img_02.png",
    "Close-up of Wang Yuan's face in yellow-black delivery jacket. Eyes half-closed in concentration. Rhythm absorbed into muscle memory. Tunnel vision. Everything beyond his hands blurred. Sweat and rain. Canopy fluorescent light. " + SC,
    ["wy"])

gen("cpr_rhythm", "img_03.png",
    "Extreme close-up of Wang Yuan's lower face, teeth clenched, jaw tight. Sweat and rain droplets mixing and dripping from his chin. Shallow depth of field. Canopy light. " + SC,
    ["wy"])

gen("cpr_rhythm", "img_04.png",
    "Extreme close-up of Wang Yuan's hands during compression, veins prominent on the back of hands, knuckles white from pressure. Rain running over the skin. " + SC,
    ["wy"])

gen("cpr_rhythm", "img_05.png",
    "Detail close-up of the elderly man's face with gray-white hair. Mouth slightly open, head moving subtly with each compression. Lips still blue-purple. Passive recipient of the compressions. Under canopy light. " + SC,
    ["lr"])

gen("cpr_rhythm", "img_06.png",
    "Ground-level shot, a row of bystanders' shoes and feet at the edge of a puddle under the canopy. One pair of feet subtly stepping backward. Ripples in the water. The quiet retreat of those who cannot bear the intensity. " + SC)

gen("cpr_rhythm", "img_07.png",
    "Wide exterior shot, the elevated highway above, the empty road stretching into darkness below. Rain pouring. Streetlights reflecting on wet asphalt. No ambulance in sight. " + SC)

# ================================================================
# cpr_fatigue (3 images)
# ================================================================
print("\n=== cpr_fatigue ===")

gen("cpr_fatigue", "img_01.png",
    "Close-up of Wang Yuan's face in yellow-black delivery jacket during ongoing CPR. Breathing ragged and irregular, mouth partly open for air. Rain and sweat mixed on his skin. Eyes straining to stay focused. Harsh overhead canopy light. " + SC,
    ["wy"])

gen("cpr_fatigue", "img_02.png",
    "Side-angle medium shot, Wang Yuan in yellow-black delivery jacket still performing compressions on the elderly man but with visibly trembling arms and sagging shoulders. Posture deteriorating from exhaustion. Wet ground visible. Canopy light. " + SC,
    ["wy", "lr"])

gen("cpr_fatigue", "img_03.png",
    "Overhead medium shot, Wang Yuan in yellow-black jacket looking down at the elderly patient between compressions. Face showing realization of nearing physical limit. Hands still working because stopping is not an option. Documentary realism. " + SC,
    ["wy", "lr"])

# ================================================================
# let_others (4 images)
# ================================================================
print("\n=== let_others ===")

gen("let_others", "img_01.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket looking up from CPR toward a young Chinese man, a passerby in his 20s wearing black-framed glasses and a dark green jacket. The young man has stepped close enough to help. Wang Yuan exhausted but commanding. The young man nervous yet willing. Heavy rain beyond canopy. " + SC,
    ["wy"])

gen("let_others", "img_02.png",
    "Action shot, a young Chinese man in black-framed glasses and dark green jacket moving into CPR position beside the elderly patient. Wang Yuan in yellow-black jacket physically guiding his shoulder line and arm angle for correct compressions. The handoff happening without a pause. Under the canopy. " + SC,
    ["wy", "lr"])

gen("let_others", "img_03.png",
    "Medium close shot, Lin Xiaoyu, 19-year-old Chinese woman with low ponytail, silver-rimmed glasses and light grey hoodie, now standing closer to the elderly patient. Giving technical correction to the new rescuer, one hand raised to signal pacing. Rain on her hair. Hesitation replaced by practical authority. " + SC,
    ["lxy", "lr"])

gen("let_others", "img_04.png",
    "Wide shot, the rescue now operating as a small coordinated team under the subway canopy. A young passerby in black-framed glasses and dark green jacket compressing, Wang Yuan in yellow-black jacket supervising, Lin Xiaoyu in light grey hoodie cueing rhythm, Sun Jianguo in grey suit holding phone on speaker. Crowd finally contributing. " + SC,
    ["wy", "lxy", "mg"])

# ================================================================
# keep_going (10 images)
# ================================================================
print("\n=== keep_going ===")

gen("keep_going", "img_01.png",
    "Close-up, Wang Yuan's face in profile in yellow-black delivery jacket. Jaw clenched tight. Compression rhythm visible in his shoulder movement. Pure physical willpower. Under canopy light. " + SC,
    ["wy"])

gen("keep_going", "img_02.png",
    "Detail shot, sweat and rain mixing on Wang Yuan's forehead in yellow-black delivery jacket, streaming down past his eye and dripping from his chin. Exhaustion made visible through fluid. Canopy light. " + SC,
    ["wy"])

gen("keep_going", "img_03.png",
    "Medium shot, Lin Xiaoyu, a 19-year-old Chinese woman with low ponytail, silver-rimmed glasses and light grey hoodie, noticing Wang Yuan's arms stiffening from the crowd line. Her body instinctively moving forward through the bystanders. Concern on her face. Under the canopy. " + SC,
    ["lxy"])

gen("keep_going", "img_04.png",
    "Medium shot of Lin Xiaoyu in light grey hoodie, head turned toward the crowd beside her, mouth open shouting a call for help, hand gesturing urgently. Finally organizing instead of freezing. Under the canopy. " + SC,
    ["lxy"])

gen("keep_going", "img_05.png",
    "Wide shot, Lin Xiaoyu's call cutting through the rain. Several bystanders turning to look. A young man stepping forward hesitantly. The rescue shifting from individual to collective. Under the subway canopy. " + SC,
    ["lxy"])

gen("keep_going", "img_06.png",
    "Close-up of Wang Yuan in yellow-black delivery jacket. He hears the call but stubbornness and fear of stopping keep him going. Expression of someone who cannot yet let go. Compressions continuing through exhaustion. Under the canopy. " + SC,
    ["wy"])

gen("keep_going", "img_07.png",
    "Medium shot, Wang Yuan in yellow-black jacket in the same kneeling position but visibly more deteriorated. Shoulders drooping, breathing heavier. Crowd positions subtly changed around him. Fatigue deepened. Under canopy. " + SC,
    ["wy"])

gen("keep_going", "img_08.png",
    "Action shot, Wang Yuan in yellow-black jacket finally accepting help. A young passerby in black-framed glasses and dark green jacket positioned beside him ready to take over. Wang Yuan counting down with a raised finger. The moment of surrender and trust. Under the canopy. " + SC,
    ["wy"])

gen("keep_going", "img_09.png",
    "Medium shot, the young passerby in black-framed glasses and dark green jacket now compressing while Wang Yuan in yellow-black jacket beside him guides with voice and hands on the rescuer's shoulder. Compressions continuing without interruption. Under the canopy. " + SC,
    ["wy"])

gen("keep_going", "img_10.png",
    "Wide shot, the team operating together under the canopy. Passerby in dark green jacket compressing, Wang Yuan in yellow-black jacket supervising, Lin Xiaoyu in light grey hoodie timing, Sun Jianguo in grey suit on phone. The fight becoming shared. Rain outside. " + SC,
    ["wy", "lxy", "mg"])

print("\n=== Part 2 done (name_witness through keep_going) ===")
