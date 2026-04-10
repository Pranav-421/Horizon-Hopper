# app.py — Horizon Hopper v2 · Revamped UI + Login + Feedback Agent
import streamlit as st
import json, os
from app.services.orchestrator import run_planner
from app.agents.memory_agent import authenticate, load_user_memory, get_all_users
from app.agents.feedback_agent import run_feedback_refinement, save_feedback_to_memory, detect_section

st.set_page_config(
    page_title="Horizon Hopper",
    page_icon="🌏",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
:root {
  --saffron:#FF6B35;--gold:#FFB347;--teal:#0D9488;--deep-teal:#0F766E;
  --indigo:#4F46E5;--cream:#FFF8F0;--sand:#F5E6D3;--dark:#1C1917;
  --mid:#44403C;--light-mid:#78716C;--card-bg:#FFFFFF;
}
html,body,.stApp{background:var(--cream)!important;}
*{font-family:'DM Sans','Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif!important;}
h1,h2,h3{font-family:'Playfair Display','Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',serif!important;}
#MainMenu,footer,header{visibility:hidden;}
.block-container{padding:0 2rem 2rem 2rem!important;max-width:1200px!important;}
.login-hero{background:linear-gradient(135deg,var(--saffron) 0%,var(--gold) 50%,var(--teal) 100%);
  border-radius:24px;padding:3rem 2rem;text-align:center;margin-bottom:2rem;position:relative;overflow:hidden;}
.login-hero::before{content:'✈️🌏🗺️';font-size:6rem;position:absolute;top:-1rem;right:-1rem;opacity:.12;transform:rotate(15deg);}
.login-hero h1{color:white!important;font-size:3rem!important;margin:0!important;text-shadow:0 2px 8px rgba(0,0,0,.3);}
.login-hero p{color:rgba(255,255,255,.9);font-size:1.1rem;margin-top:.5rem;}
.login-card{background:white;border-radius:20px;padding:2rem;box-shadow:0 8px 40px rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.1);}
.app-header{background:linear-gradient(135deg,var(--dark) 0%,var(--mid) 100%);border-radius:0 0 28px 28px;
  padding:1.2rem 2rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,.15);}
.app-header-title{color:white;font-family:'Playfair Display',serif!important;font-size:1.6rem;}
.user-pill{background:rgba(255,107,53,.25);border:1px solid var(--saffron);border-radius:50px;padding:6px 16px;color:var(--gold);font-weight:600;font-size:.9rem;}
.form-card{background:white;border-radius:20px;padding:1.8rem;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid rgba(255,107,53,.08);margin-bottom:1.5rem;}
.stButton>button[kind="primary"]{background:linear-gradient(135deg,var(--saffron),var(--gold))!important;border:none!important;
  border-radius:14px!important;font-size:1.1rem!important;font-weight:600!important;padding:.75rem 2rem!important;
  color:white!important;box-shadow:0 4px 16px rgba(255,107,53,.4)!important;transition:transform .15s!important;}
.stButton>button[kind="primary"]:hover{transform:translateY(-2px)!important;}
.intent-badge{display:inline-block;padding:5px 18px;border-radius:50px;font-size:.85rem;font-weight:600;letter-spacing:.03em;margin-bottom:1rem;}
.badge-office{background:#DBEAFE;color:#1D4ED8;}
.badge-business{background:#D1FAE5;color:#065F46;}
.badge-interview{background:#FEF3C7;color:#92400E;}
.badge-leisure{background:#FFE4E6;color:#BE123C;}
.update-banner{background:linear-gradient(90deg,#059669,#0D9488);color:white;padding:10px 20px;
  border-radius:10px;font-weight:600;margin-bottom:1rem;}
.itin-card{background:linear-gradient(160deg,#FFFAF5 0%,#FFF0E8 100%);border-left:5px solid var(--saffron);
  border-radius:0 16px 16px 0;padding:1.5rem 1.8rem;line-height:1.9;font-size:.97rem;color:var(--dark);
  box-shadow:0 4px 20px rgba(255,107,53,.08);}
.transport-card{background:white;border:1px solid #E8E8E8;border-radius:14px;padding:1rem 1.2rem;
  margin-bottom:.8rem;border-left:4px solid var(--teal);box-shadow:0 2px 8px rgba(0,0,0,.04);}
.hotel-card{background:white;border:1px solid #E8E8E8;border-radius:14px;padding:1rem 1.2rem;
  margin-bottom:.8rem;border-left:4px solid var(--gold);}
.attraction-card{background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08);
  margin-bottom:1rem;border:1px solid rgba(0,0,0,.05);}
.attraction-body{padding:.9rem 1.1rem;}
.attraction-name{font-weight:700;font-size:1.05rem;color:var(--dark);}
.attraction-meta{font-size:.85rem;color:var(--light-mid);margin-top:2px;}
.memory-card{background:linear-gradient(135deg,#F0FDF4,#ECFDF5);border:1px solid #A7F3D0;border-radius:16px;padding:1.2rem;}
.memory-stat{background:white;border-radius:10px;padding:.7rem 1rem;margin-bottom:.5rem;font-size:.9rem;border-left:3px solid var(--teal);}
.feedback-section{background:linear-gradient(135deg,#EEF2FF,#F0F9FF);border:2px dashed var(--indigo);
  border-radius:18px;padding:1.5rem;margin-top:1.5rem;}
.feedback-title{font-family:'Playfair Display',serif!important;font-size:1.2rem;color:var(--indigo);font-weight:700;margin-bottom:.5rem;}
.feedback-hint{font-size:.82rem;color:var(--light-mid);margin-bottom:1rem;line-height:1.6;}
.stTabs [data-baseweb="tab-list"]{background:var(--sand)!important;border-radius:12px!important;padding:4px!important;gap:4px!important;}
.stTabs [data-baseweb="tab"]{border-radius:9px!important;font-weight:500!important;color:var(--mid)!important;}
.stTabs [aria-selected="true"]{background:white!important;color:var(--saffron)!important;box-shadow:0 2px 8px rgba(0,0,0,.1)!important;}
[data-testid="metric-container"]{background:white;border-radius:14px;padding:1rem;border:1px solid var(--sand);box-shadow:0 2px 8px rgba(0,0,0,.04);}
section[data-testid="stSidebar"]{background:var(--dark)!important;}
section[data-testid="stSidebar"] *{color:#D6D3D1!important;}
section[data-testid="stSidebar"] h2,section[data-testid="stSidebar"] h3{color:var(--gold)!important;}
.stTextInput input,.stTextArea textarea{border-radius:10px!important;border:1.5px solid #E7E0D8!important;background:#FAFAF8!important;}
.stTextInput input:focus,.stTextArea textarea:focus{border-color:var(--saffron)!important;box-shadow:0 0 0 3px rgba(255,107,53,.12)!important;}
.section-hdr{font-size:1rem;font-weight:700;color:var(--mid);border-bottom:2px solid var(--sand);
  padding-bottom:6px;margin:.8rem 0;text-transform:uppercase;letter-spacing:.05em;}
</style>
""", unsafe_allow_html=True)

# Session state init
for key, default in [("logged_in",False),("user",None),("result",None),
                      ("trip_context",None),("feedback_applied",False),("updated_section",None)]:
    if key not in st.session_state:
        st.session_state[key] = default


def show_login():
    st.markdown('<div class="login-hero"><h1>🌏 Horizon Hopper</h1><p>Your Agentic Travel Planner for Chennai & Chengalpattu</p></div>', unsafe_allow_html=True)
    col_l, col_c, col_r = st.columns([1,1.6,1])
    with col_c:
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown("### 👋 Sign In")
        st.caption("Use a sample account below or your own credentials")
        st.markdown("**Quick Login:**")
        users = get_all_users()
        cols = st.columns(len(users))
        for i,(uid,udata) in enumerate(users.items()):
            with cols[i]:
                if st.button(f"{udata['avatar']} {udata['name'].split()[0]}", key=f"quick_{uid}", use_container_width=True):
                    st.session_state["_pu"] = uid
                    st.session_state["_pp"] = udata["password"]
                    st.rerun()
        st.divider()
        username = st.text_input("Username", value=st.session_state.get("_pu",""), placeholder="arjun / priya / vikram")
        password = st.text_input("Password", value=st.session_state.get("_pp",""), type="password")
        if st.button("🚀 Login", type="primary", use_container_width=True):
            user = authenticate(username.strip(), password.strip())
            if user:
                st.session_state.update({"logged_in":True,"user":user})
                for k in ["_pu","_pp"]: st.session_state.pop(k,None)
                st.rerun()
            else:
                st.error("❌ Invalid username or password.")
        st.markdown("</div>", unsafe_allow_html=True)
        with st.expander("📋 Sample Credentials"):
            st.markdown("""
| Avatar | Username | Password | Style |
|--------|----------|----------|-------|
| 🧑‍💼 | `arjun` | `arjun123` | Office • Metro • Veg |
| 👩‍💻 | `priya` | `priya456` | Leisure • Cab • Non-Veg |
| 🧑‍🎓 | `vikram`| `vikram789`| Budget • Bus • Job seeker |
""")


def show_app():
    user = st.session_state["user"]
    mem  = load_user_memory(user["id"])

    st.markdown(f'<div class="app-header"><div class="app-header-title">🌏 Horizon Hopper</div><div class="user-pill">{user["avatar"]} {user["name"]}</div></div>', unsafe_allow_html=True)

    with st.sidebar:
        st.markdown(f"## {user['avatar']} {user['name']}")
        st.caption("Personal travel profile")
        st.divider()
        st.markdown("### ✈️ Quick Examples")
        examples = {
            "🚇 Office Commute": ("Tambaram","Tidel Park","Office Commute","₹100–₹200","By 9:00 AM","Prefer metro, avoid peak traffic"),
            "💼 Business Trip":  ("Chennai Central","Guindy","Business Meeting","₹2000–₹4000","By 10:00 AM","Need veg food, hotel near DLF IT Park"),
            "📝 Job Interview":  ("Velachery","Siruseri SIPCOT","Job Interview","₹500–₹1000","By 10:30 AM","Cheapest route, budget stay"),
            "🏖️ Weekend Trip":   ("Chennai","Mahabalipuram","Leisure / Tourism","₹1500–₹3000","Flexible","Beaches, temples, seafood"),
        }
        for label,vals in examples.items():
            if st.button(label, use_container_width=True):
                st.session_state["ex"] = vals
        st.divider()
        st.markdown("### 🧠 Your Preferences")
        for icon,label,key in [("🚇","Transport","preferred_transport"),("🍽️","Food","food_preference"),
                                 ("💰","Budget","budget_range"),("🏨","Stay","accommodation_type")]:
            if mem.get(key): st.markdown(f"{icon} **{label}:** {mem[key]}")
        if mem.get("avoid"): st.markdown(f"🚫 **Avoid:** {', '.join(mem['avoid'])}")
        st.markdown(f"🗂️ **Trips:** {len(mem.get('past_trips',[]))}")
        past = mem.get("past_trips",[])
        if past:
            st.divider()
            st.markdown("### 🗂️ Recent Trips")
            for t in reversed(past[-4:]):
                icon = {"office_commute":"🏢","leisure_trip":"🏖️","business_trip":"💼","job_interview":"📝"}.get(t.get("intent",""),"✈️")
                st.caption(f"{icon} {t['date'][:10]}  \n{t['input'][:55]}…")
        notes = mem.get("feedback_notes",[])
        if notes:
            st.divider()
            st.markdown("### 💬 Feedback History")
            for n in notes[-4:]: st.caption(n)
        st.divider()
        if st.button("🚪 Logout", use_container_width=True):
            for k in ["logged_in","user","result","trip_context","feedback_applied","updated_section","ex"]: st.session_state.pop(k,None)
            st.rerun()

    ex = st.session_state.get("ex",("","","Office Commute","","",""))
    purpose_list = ["Office Commute","Business Meeting","Job Interview","Leisure / Tourism","Shopping","Medical Visit","Other"]

    st.markdown('<div class="form-card">', unsafe_allow_html=True)
    st.markdown("### 🗺️ Plan Your Trip")
    c1,c2 = st.columns(2)
    with c1:
        source      = st.text_input("📍 From", value=ex[0], placeholder="e.g. Tambaram, Velachery")
        destination = st.text_input("🏁 To",   value=ex[1], placeholder="e.g. Tidel Park, Mahabalipuram")
        purpose     = st.selectbox("🎯 Purpose", purpose_list, index=purpose_list.index(ex[2]) if ex[2] in purpose_list else 0)
    with c2:
        budget      = st.text_input("💰 Budget (INR)", value=ex[3], placeholder="e.g. ₹200–₹500")
        travel_time = st.text_input("⏰ Arrival Time",  value=ex[4], placeholder="e.g. By 9 AM, Flexible")
        preferences = st.text_area("⚙️ Preferences",   value=ex[5], placeholder="Prefer metro, veg food, avoid highways", height=108)
    st.markdown("</div>", unsafe_allow_html=True)

    if st.button("🚀 Plan My Trip", type="primary", use_container_width=True):
        if not source or not destination:
            st.warning("⚠️ Please enter both source and destination.")
        else:
            with st.spinner("🤖 Agents crafting your perfect trip..."):
                import time
                prog = st.progress(0,"🔍 Analysing your request...")
                for pct,msg in [(25,"📍 Mapping locations..."),(50,"🚇 Finding routes..."),(75,"🏨 Searching stays..."),(90,"📋 Writing itinerary...")]:
                    time.sleep(0.25); prog.progress(pct,msg)
                result = run_planner(source,destination,purpose,budget,travel_time,preferences,user_id=user["id"])
                prog.progress(100,"✅ Done!")
            st.session_state.update({
                "result": result,
                "trip_context": dict(source=source,destination=destination,purpose=purpose,budget=budget,travel_time=travel_time,preferences=preferences),
                "feedback_applied": False, "updated_section": None,
            })
            st.rerun()

    result = st.session_state.get("result")
    if not result: return

    st.success("✅ Your travel plan is ready!")
    st.divider()

    intent = result.get("intent","leisure_trip")
    badge_map = {"office_commute":("🏢 Office Commute","badge-office"),"business_trip":("💼 Business Trip","badge-business"),
                 "job_interview":("📝 Job Interview","badge-interview"),"leisure_trip":("🏖️ Leisure Trip","badge-leisure")}
    label,cls = badge_map.get(intent,("✈️ Trip","badge-leisure"))
    st.markdown(f'<span class="intent-badge {cls}">{label}</span>', unsafe_allow_html=True)

    upd = st.session_state.get("updated_section")
    if upd:
        st.markdown(f'<div class="update-banner">✨ Updated: {upd.replace("_"," ").title()} — based on your feedback!</div>', unsafe_allow_html=True)

    tab1,tab2,tab3,tab4 = st.tabs(["📋 Full Itinerary","🚇 Commute Options","🏨 Stay & Services","🗺️ Attractions"])

    with tab1:
        itin = result.get("final_itinerary","No itinerary generated.")
        is_err = any(itin.startswith(p) for p in ("⚠️","❌","🔌","⏳"))
        if is_err:
            st.error(itin)
        else:
            st.markdown('<div class="itin-card">'+itin.replace("\n","<br>")+'</div>', unsafe_allow_html=True)

    with tab2:
        loc = result.get("location_info",{})
        if loc:
            mc1,mc2,mc3 = st.columns(3)
            mc1.metric("📏 Distance",   f"{loc.get('approximate_distance_km','?')} km")
            mc2.metric("⏱️ Drive Time", f"{loc.get('estimated_drive_time_mins','?')} min")
            mc3.metric("🚇 Metro",      loc.get("nearest_metro_source","NA"))
            if loc.get("travel_notes"): st.info(f"ℹ️ {loc['travel_notes']}")
        commute = result.get("commute_options","")
        if commute:
            st.markdown('<div class="transport-card">'+commute.replace("\n","<br>")+'</div>', unsafe_allow_html=True)

    with tab3:
        stay = result.get("stay_options","")
        if stay:
            st.markdown('<div class="hotel-card">'+stay.replace("\n","<br>")+'</div>', unsafe_allow_html=True)

    with tab4:
        attractions_text = result.get("attractions","")
        if attractions_text:
            st.markdown(attractions_text)
        st.markdown('<div class="section-hdr">📸 Attraction Photos</div>', unsafe_allow_html=True)
        tc   = st.session_state.get("trip_context",{})
        dest = tc.get("destination","Chennai")
        all_spots = [
            ("Marina Beach",          "marina+beach+chennai"),
            ("Mahabalipuram Temple",  "mahabalipuram+shore+temple"),
            ("Kapaleeshwarar Temple", "kapaleeshwarar+temple+chennai"),
            ("Vandalur Zoo",          "zoo+animals+india"),
            ("Guindy National Park",  "national+park+deer+india"),
            ("T.Nagar Shopping",      "chennai+market+shopping"),
            ("Tidel Park IT Hub",     "chennai+IT+park+tech"),
            ("ECR Beach Road",        "ecr+beach+road+chennai"),
        ]
        photo_cols = st.columns(4)
        for i,(spot_name,query) in enumerate(all_spots[:4]):
            with photo_cols[i]:
                img_url = f"https://source.unsplash.com/400x280/?{query}"
                st.markdown(f"""
<div class="attraction-card">
  <img src="{img_url}" style="width:100%;height:150px;object-fit:cover;"
       onerror="this.src='https://picsum.photos/seed/{i+42}/400/280'">
  <div class="attraction-body">
    <div class="attraction-name">📍 {spot_name}</div>
    <div class="attraction-meta">Chennai / Chengalpattu</div>
  </div>
</div>""", unsafe_allow_html=True)

    # ── FEEDBACK PANEL ────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown("""
<div class="feedback-section">
  <div class="feedback-title">🔄 Want to refine your plan?</div>
  <div class="feedback-hint">
    Tell us what to change — e.g. <em>"Show cheaper hotels under ₹800"</em>, <em>"I prefer bike taxi"</em>, <em>"Show temple attractions only"</em>, <em>"Avoid highways in route"</em>.<br>
    <strong>Smart Refine™:</strong> Only the relevant section is updated — saving your free API quota ✅
  </div>
</div>""", unsafe_allow_html=True)

    feedback_input = st.text_area("✍️ Your feedback",
        placeholder="e.g. Show budget hotels under ₹1000 | Change route to avoid highways | More beach attractions",
        height=88, key="fb_box", label_visibility="collapsed")

    fb_c1,fb_c2 = st.columns([1,1])
    with fb_c1:
        refine_btn = st.button("✨ Apply Changes", type="primary", use_container_width=True)
    with fb_c2:
        satisfied_btn = st.button("✅ Save to My Profile", use_container_width=True)

    if refine_btn and feedback_input.strip():
        detected = detect_section(feedback_input)
        labels = {"stay_options":"🏨 Stay","commute_options":"🚇 Commute","attractions":"🗺️ Attractions","final_itinerary":"📋 Full Itinerary"}
        with st.spinner(f"🤖 Refining {labels.get(detected,'your plan')}..."):
            updated = run_feedback_refinement(st.session_state["result"], feedback_input, st.session_state["trip_context"])
        if "_feedback_error" in updated:
            st.error(updated["_feedback_error"])
        else:
            st.session_state.update({"result":updated,"updated_section":updated.get("_updated_section"),"feedback_applied":True})
            st.rerun()

    if satisfied_btn:
        fb = feedback_input.strip() or "User confirmed plan"
        sec = st.session_state.get("updated_section","general")
        save_feedback_to_memory(user["id"], fb, sec, satisfied=True)
        st.success("✅ Saved to your profile!")
        st.balloons()

    st.divider()
    with st.expander("🧠 Your Travel Profile"):
        md = result.get("memory", load_user_memory(user["id"]))
        st.markdown('<div class="memory-card">', unsafe_allow_html=True)
        mc1,mc2 = st.columns(2)
        with mc1:
            for icon,label,key in [("🚇","Transport","preferred_transport"),("🍽️","Food","food_preference"),("💰","Budget","budget_range")]:
                st.markdown(f'<div class="memory-stat">{icon} <b>{label}:</b> {md.get(key) or "Not set"}</div>', unsafe_allow_html=True)
        with mc2:
            st.markdown(f'<div class="memory-stat">🚫 <b>Avoid:</b> {", ".join(md.get("avoid",[])) or "Nothing"}</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="memory-stat">🏨 <b>Stay:</b> {md.get("accommodation_type") or "Not set"}</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="memory-stat">🗂️ <b>Trips:</b> {len(md.get("past_trips",[]))}</div>', unsafe_allow_html=True)
        notes = md.get("feedback_notes",[])
        if notes:
            st.markdown("**💬 Feedback Notes:**")
            for n in notes[-5:]: st.caption(n)
        st.markdown("</div>", unsafe_allow_html=True)

    st.divider()
    st.caption("🌏 Horizon Hopper v2 · Powered by Groq LLaMA · Built for Chennai Travelers")


if not st.session_state["logged_in"]:
    show_login()
else:
    show_app()
