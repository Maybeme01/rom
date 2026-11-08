/* ==========================================================================
   PyCode Studio - Python Academy (أكاديمية وشروحات بايثون التفاعلية)
   Comprehensive Arabic & English interactive lessons, code snippets,
   essential libraries guide, and 1-click execution in Monaco Editor
   ========================================================================== */

const PYTHON_LESSONS = [
  {
    id: 'variables',
    title: '1. المتغيرات والطباعة (Variables & Print)',
    badge: 'الأساسيات',
    desc: 'تعلم كيف تطبع النصوص والأرقام، وتنشئ المتغيرات وأنواع البيانات الأساسية (نصوص، أرقام صحيحة وعشرية، وبوليان).',
    code: `# درس 1: المتغيرات والطباعة في بايثون

# 1. الطباعة البسيطة
print("👋 أهلاً بك في عالم بايثون!")

# 2. إنشاء المتغيرات
name = "كوين روري"       # نص (String)
age = 22                 # رقم صحيح (Integer)
height = 1.68            # رقم عشري (Float)
is_programmer = True     # قيمة منطقية (Boolean)

# 3. دمج النصوص باستخدام f-strings (الطريقة الأحدث والأفضل)
print(f"الاسم: {name}")
print(f"العمر: {age} سنة")
print(f"الطول: {height} متر")
print(f"هل يبرمج؟: {is_programmer}")

# 4. معرفة نوع البيانات باستخدام type()
print("نوع متغير name هو:", type(name))
print("نوع متغير age هو:", type(age))
`
  },
  {
    id: 'strings',
    title: '2. النصوص وتنسيقها (Strings Manipulation)',
    badge: 'الأساسيات',
    desc: 'التعامل مع النصوص، التحويل لأحرف كبيرة وصغيرة، التقطيع، والاستبدال والتكرار.',
    code: `# درس 2: النصوص في بايثون

text = "Python Programming is Amazing"

print("النص الأصلي:", text)
print("أحرف كبيرة:", text.upper())
print("أحرف صغيرة:", text.lower())
print("طول النص:", len(text))
print("استبدال كلمة:", text.replace("Amazing", "Super Fun!"))

# تقطيع النص (Slicing)
print("أول 6 أحرف:", text[:6])
print("عكس النص بالكامل:", text[::-1])

# التحقق من وجود كلمة
if "Python" in text:
    print("✅ كلمة Python موجودة في النص!")
`
  },
  {
    id: 'conditions',
    title: '3. الشروط والقرارات (If, Elif, Else)',
    badge: 'التحكم',
    desc: 'اتخاذ القرارات البرمجية ومقارنة القيم واستخدام المعاملات المنطقية (and, or, not).',
    code: `# درس 3: الشروط واتخاذ القرارات

score = 88

print(f"درجة الطالب: {score}")

if score >= 90:
    grade = "A (ممتاز) 🌟"
elif score >= 80:
    grade = "B (جيد جداً) 👏"
elif score >= 70:
    grade = "C (جيد) 👍"
elif score >= 50:
    grade = "D (مقبول)"
else:
    grade = "F (راسب) ❌"

print(f"التقدير النهائي: {grade}")

# شرط منطقي متعدد
has_id = True
if score >= 50 and has_id:
    print("🎉 مبروك! مسموح لك باستلام الشهادة.")
`
  },
  {
    id: 'loops',
    title: '4. الحلقات والتكرار (For & While Loops)',
    badge: 'التحكم',
    desc: 'تكرار الأوامر باستخدام حلقة for مع range()، والتكرار على القوائم، وحلقة while مع break و continue.',
    code: `# درس 4: حلقات التكرار (Loops)

print("--- 1. حلقة for مع range(1, 6) ---")
for i in range(1, 6):
    print(f"العدد: {i} - مربعه: {i**2}")

print("\\n--- 2. التكرار عبر قائمة أسماء ---")
fruits = ["تفاح 🍎", "موز 🍌", "فراولة 🍓", "كرز 🍒"]
for fruit in fruits:
    print(f"أنا أحب {fruit}")

print("\\n--- 3. حلقة while (العد التنازلي) ---")
count = 5
while count > 0:
    print(f"الصاروخ سينطلق خلال: {count}...")
    count -= 1
print("🚀 انطلاق!")
`
  },
  {
    id: 'lists_dicts',
    title: '5. القوائم والقواميس (Lists & Dictionaries)',
    badge: 'هياكل البيانات',
    desc: 'حفظ وتعديل وتنسيق مجموعات البيانات باستخدام القوائم [] والقواميس {مفتاح: قيمة}.',
    code: `# درس 5: القوائم والقواميس

# 1. القوائم (Lists)
students = ["سارة", "أحمد", "نورة", "خالد"]
students.append("ريم")       # إضافة عنصر
students.sort()              # ترتيب أبجدي
print("قائمة الطلاب المرتبة:", students)
print("عدد الطلاب:", len(students))

# 2. القواميس (Dictionaries - Key & Value)
user_profile = {
    "username": "queen_rori",
    "level": "Expert",
    "points": 1500,
    "is_active": True
}

print("\\nمعلومات المستخدم:")
print(f"اسم المستخدم: {user_profile['username']}")
print(f"النقاط: {user_profile['points']}")

# التكرار على القاموس
for key, value in user_profile.items():
    print(f"  • {key}: {value}")
`
  },
  {
    id: 'functions',
    title: '6. الدوال وإعادة الاستخدام (Functions & def)',
    badge: 'تنظيم الكود',
    desc: 'كيفية كتابة دوال قابلة لإعادة الاستخدام، المعاملات، القيم الافتراضية، والقيمة المرجعة return.',
    code: `# درس 6: الدوال في بايثون

# دالة تقوم بحساب ضريبة وسعر المنتج الإجمالي
def calculate_total(price, tax_rate=0.15):
    """تحسب السعر شامل ضريبة القيمة المضافة"""
    tax = price * tax_rate
    total = price + tax
    return total, tax

# استدعاء الدالة
item_price = 200
final_price, tax_amount = calculate_total(item_price)

print(f"السعر الأساسي: {item_price} ريال")
print(f"مبلغ الضريبة (15%): {tax_amount:.2f} ريال")
print(f"المجموع النهائي: {final_price:.2f} ريال")

# دالة ترحيبية لطيفة
def send_greeting(user, badge="👑"):
    return f"{badge} مرحباً بعودتك يا {user}! نتمنى لك يوماً رائعاً {badge}"

print(send_greeting("كوين روري"))
`
  },
  {
    id: 'oop',
    title: '7. الكائنات والأصناف (OOP - Classes)',
    badge: 'متقدم',
    desc: 'البرمجة كائنية التوجه: الأصناف، الدالة البنائية __init__، الكائنات، وتغليف البيانات والوظائف.',
    code: `# درس 7: البرمجة كائنية التوجه (OOP)

class BankAccount:
    def __init__(self, owner, initial_balance=0):
        self.owner = owner
        self.balance = initial_balance

    def deposit(self, amount):
        if amount > 0:
            self.balance += amount
            print(f"✅ تم إيداع {amount} ريال بنجاح. الرصيد الحالي: {self.balance} ريال")
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            print(f"❌ عذراً {self.owner}، رصيدك غير كافٍ! (الرصيد: {self.balance})")
        else:
            self.balance -= amount
            print(f"💸 تم سحب {amount} ريال. المتبقي: {self.balance} ريال")
        return self.balance

# إنشاء حساب بنكي
account = BankAccount("كوين روري", 1000)
account.deposit(500)
account.withdraw(300)
account.withdraw(2000)
`
  },
  {
    id: 'exceptions',
    title: '8. معالجة الأخطاء (Try / Except)',
    badge: 'الحماية',
    desc: 'حماية برنامجك من الانهيار عند حدوث أخطاء غير متوقعة مثل القسمة على صفر أو إدخال خاطئ.',
    code: `# درس 8: معالجة الأخطاء (Error Handling)

def safe_divide(a, b):
    try:
        result = a / b
        print(f"✅ نتيجة قسمة {a} ÷ {b} = {result}")
        return result
    except ZeroDivisionError:
        print(f"⚠️ خطأ: لا يمكن القسمة على الصفر ({a} ÷ {b})!")
    except TypeError as e:
        print(f"⚠️ خطأ في نوع المدخلات: {e}")
    finally:
        print("--- نهاية عملية القسمة ---")

safe_divide(20, 4)
safe_divide(10, 0)
safe_divide(15, "نص")
`
  },
  {
    id: 'file_io',
    title: '9. التعامل مع الملفات (File I/O)',
    badge: 'البيانات',
    desc: 'كتابة البيانات وقراءتها وحفظها على الملفات النصية وملفات JSON الافتراضية داخل بيئة العمل.',
    code: `# درس 9: قراءة وكتابة الملفات

# 1. كتابة ملف جديد
filename = "my_notes.txt"
with open(filename, "w", encoding="utf-8") as f:
    f.write("سطر 1: مرحبا بكم في PyCode Studio\\n")
    f.write("سطر 2: بايثون لغة سهلة وممتعة للغاية!\\n")
    f.write("سطر 3: تم حفظ هذا الملف بنجاح داخل نظام الملفات.\\n")
print(f"✅ تم إنشاء وكتابة الملف '{filename}'")

# 2. قراءة الملف وطباعته
print("\\n--- قراءة محتوى الملف ---")
with open(filename, "r", encoding="utf-8") as f:
    content = f.read()
    print(content)
`
  },
  {
    id: 'core_libraries',
    title: '10. شرح واستخدام المكتبات الأساسية (Core Libraries)',
    badge: 'المكتبات',
    desc: 'شرح مفصل مع أمثلة لأهم مكتبات بايثون القياسية: math (الرياضيات), random (العشوائيات), datetime (الوقت والتاريخ), json (بيانات الويب).',
    code: `# درس 10: المكتبات الأساسية الشائعة في بايثون

import math
import random
import datetime
import json

print("=== 1. مكتبة math (الرياضيات) ===")
print("الجذر التربيعي لـ 81:", math.sqrt(81))
print("ثابت باي (Pi):", math.pi)
print("تقريب للأعلى ceil(4.2):", math.ceil(4.2))
print("تقريب للأسفل floor(4.8):", math.floor(4.8))

print("\\n=== 2. مكتبة random (العشوائيات) ===")
dice = random.randint(1, 6)
print("رمية النرد العشوائية:", dice)
colors = ["أحمر", "أزرق", "أخضر", "ذهبي"]
print("اللون المختار عشوائياً:", random.choice(colors))

print("\\n=== 3. مكتبة datetime (الوقت والتاريخ) ===")
now = datetime.datetime.now()
print("الوقت الحالي:", now.strftime("%Y-%m-%d %H:%M:%S"))
print("اسم اليوم:", now.strftime("%A"))

print("\\n=== 4. مكتبة json (بيانات الويب) ===")
data = {"name": "كوين روري", "skills": ["Python", "HTML", "JS"], "level": 100}
json_string = json.dumps(data, ensure_ascii=False, indent=2)
print("نص بصيغة JSON:")
print(json_string)
`
  },
  {
    id: 'matplotlib_demo',
    title: '11. مكتبة الرسم البياني (Matplotlib Visuals)',
    badge: 'علم البيانات',
    desc: 'رسم منحنيات ومخططات بيانية ملونة وعرضها مباشرة في تبويب PLOTS المخصص في الترمينال.',
    code: `# درس 11: رسم بياني ملون عبر Matplotlib
# سيظهر المخطط في تبويب [📊 PLOTS] تلقائياً

import matplotlib.pyplot as plt
import numpy as np

# إنشاء بيانات لمنحنى الجيب والجيب تمام
x = np.linspace(0, 10, 100)
y_sin = np.sin(x)
y_cos = np.cos(x)

plt.figure(figsize=(8, 4.5))
plt.plot(x, y_sin, label='Sine Wave (sin)', color='#00ffcc', linewidth=2)
plt.plot(x, y_cos, label='Cosine Wave (cos)', color='#ff007f', linewidth=2, linestyle='--')

plt.title('Interactive Python Plotting in Browser', fontsize=14, color='#ffffff')
plt.xlabel('X Axis', color='#cccccc')
plt.ylabel('Y Axis', color='#cccccc')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend()
plt.tight_layout()

# عرض الرسم البياني (سيتم التقاطه وتنزيله من تبويب PLOTS)
plt.show()
print("✅ تم إنشاء المخطط! انظر تبويب [📊 PLOTS] في الأسفل لمعاينته أو تنزيله كصورة.")
`
  },
  {
    id: 'guessing_game',
    title: '12. مشروع: لعبة تخمين الرقم (Mini Game)',
    badge: 'مشروع ممتع',
    desc: 'مشروع تفاعلي بلعبة ذكية تطلب منك تخمين رقم عشوائي مع التوجيه للأعلى أو الأسفل.',
    code: `# مشروع ممتع: لعبة تخمين الرقم السري

import random

def play_guessing_game():
    secret_number = random.randint(1, 20)
    attempts = 0
    max_attempts = 5
    
    print("🎮 أهلاً بك في لعبة تخمين الرقم السري!")
    print("اخترت رقماً بين 1 و 20. هل تستطيع معرفته خلال 5 محاولات؟\\n")
    
    # محاكاة تخمينات ذكية
    guesses = [10, 15, secret_number] # يمكنك تعديلها أو تجربة أرقام أخرى
    
    for guess in guesses:
        attempts += 1
        print(f"المحاولة {attempts}: التخمين هو ({guess})")
        if guess < secret_number:
            print("⬆️ الرقم السري أكبر من ذلك!")
        elif guess > secret_number:
            print("⬇️ الرقم السري أصغر من ذلك!")
        else:
            print(f"🎉 أحسنت صنعاً! خمنت الرقم الصحيح ({secret_number}) في {attempts} محاولات! 🏆")
            break

play_guessing_game()
`
  }
];

class PythonAcademy {
  constructor() {
    this.lessons = PYTHON_LESSONS;
  }

  init() {
    this.renderLessons();
    this.bindSearch();
  }

  renderLessons(filterText = '') {
    const container = document.getElementById('academy-lessons-container');
    if (!container) return;
    container.innerHTML = '';

    const filter = filterText.trim().toLowerCase();
    const filtered = this.lessons.filter(l => 
      l.title.toLowerCase().includes(filter) ||
      l.desc.toLowerCase().includes(filter) ||
      l.code.toLowerCase().includes(filter)
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          🔍 لم يتم العثور على دروس مطابقة لـ "${filterText}"
        </div>
      `;
      return;
    }

    filtered.forEach((lesson, index) => {
      const card = document.createElement('div');
      card.className = 'academy-card';
      card.setAttribute('data-lesson-id', lesson.id);

      card.innerHTML = `
        <div class="academy-card-header">
          <div class="academy-card-title-group">
            <span class="academy-badge">${lesson.badge}</span>
            <span class="academy-title">${lesson.title}</span>
          </div>
          <span class="academy-toggle-icon">▼</span>
        </div>
        <div class="academy-card-body">
          <p class="academy-desc">${lesson.desc}</p>
          <div class="academy-code-container">
            <pre class="academy-code-block"><code>${this.escapeHTML(lesson.code)}</code></pre>
          </div>
          <div class="academy-actions">
            <button class="btn-primary btn-run-lesson" data-id="${lesson.id}">
              ▶ تشغيل في المحرر
            </button>
            <button class="btn-secondary btn-copy-lesson" data-id="${lesson.id}">
              📋 نسخ الكود
            </button>
          </div>
        </div>
      `;

      // Toggle lesson accordion
      const header = card.querySelector('.academy-card-header');
      header.addEventListener('click', () => {
        card.classList.toggle('open');
      });

      // Run lesson in editor
      const runBtn = card.querySelector('.btn-run-lesson');
      runBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadLessonIntoEditor(lesson, true);
      });

      // Copy lesson code
      const copyBtn = card.querySelector('.btn-copy-lesson');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(lesson.code).then(() => {
          if (window.ui) {
            window.ui.showToast(`تم نسخ كود: ${lesson.title}`, 'info');
          }
        });
      });

      container.appendChild(card);
    });

    // Auto open the first card
    const firstCard = container.querySelector('.academy-card');
    if (firstCard && !filterText) {
      firstCard.classList.add('open');
    }
  }

  loadLessonIntoEditor(lesson, autoRun = true) {
    const fileName = `learn_${lesson.id}.py`;
    
    // Save file to virtual file system
    window.vfs.saveFile(fileName, lesson.code);
    if (!window.vfs.files[fileName]) {
      window.vfs.createFile(fileName, lesson.code);
    }
    window.vfs.openTab(fileName);

    if (window.ui) {
      window.ui.renderFileTree();
      window.ui.renderTabs();
      window.ui.openActiveFile();
      window.ui.showToast(`تم تحميل الدرس في الملف: ${fileName}`, 'success');

      // Auto execute the lesson script
      if (autoRun) {
        setTimeout(() => {
          window.ui.runCurrentCode();
        }, 150);
      }
    }
  }

  bindSearch() {
    const searchInput = document.getElementById('academy-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderLessons(e.target.value);
      });
    }
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Global Academy singleton
window.pythonAcademy = new PythonAcademy();

