/* =========================================================
   SUPABASE 설정
========================================================= */

const SUPABASE_URL =
    "https://wctknuijnyxbzpdplgrz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QjOYrVQHQuqpF8n8hsk_3Q__QEbvwhI";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   전역 변수
========================================================= */

let currentUser = null;
let records = [];

let authMode = "login";

let calendarDate = new Date();


/* =========================================================
   로그인 저장
========================================================= */

function saveLogin(user) {

    localStorage.setItem(
        "workoutUser",
        JSON.stringify(user)
    );
}


function loadLogin() {

    const saved =
        localStorage.getItem("workoutUser");

    if (!saved) {
        return null;
    }

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}


function removeLogin() {

    localStorage.removeItem(
        "workoutUser"
    );
}


/* =========================================================
   비밀번호 검사
========================================================= */

function checkPassword(password) {

    if (password.length < 6) {
        return false;
    }

    if (/\s/.test(password)) {
        return false;
    }

    if (!/^[A-Za-z0-9!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]+$/.test(password)) {
        return false;
    }

    if (!/[A-Za-z]/.test(password)) {
        return false;
    }

    if (!/[0-9]/.test(password)) {
        return false;
    }

    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/.test(password)) {
        return false;
    }

    return true;
}


/* =========================================================
   메시지
========================================================= */

function showAuthMessage(message) {

    document.getElementById(
        "authMessage"
    ).textContent = message;
}


/* =========================================================
   로그인 / 회원가입 탭
========================================================= */

document.getElementById("loginTab")
    .addEventListener("click", () => {

        authMode = "login";

        document
            .getElementById("loginTab")
            .classList.add("active");

        document
            .getElementById("signupTab")
            .classList.remove("active");

        document
            .getElementById("authButton")
            .textContent = "로그인";

        document
            .getElementById("passwordHint")
            .classList.add("hidden");

        showAuthMessage("");
    });


document.getElementById("signupTab")
    .addEventListener("click", () => {

        authMode = "signup";

        document
            .getElementById("signupTab")
            .classList.add("active");

        document
            .getElementById("loginTab")
            .classList.remove("active");

        document
            .getElementById("authButton")
            .textContent = "회원가입";

        document
            .getElementById("passwordHint")
            .classList.remove("hidden");

        showAuthMessage("");
    });


/* =========================================================
   로그인 / 회원가입
========================================================= */

document.getElementById("authButton")
    .addEventListener("click", async () => {

        const name =
            document
                .getElementById("authName")
                .value
                .trim();

        const password =
            document
                .getElementById("authPassword")
                .value;

        if (!name) {
            showAuthMessage(
                "이름을 입력해주세요."
            );
            return;
        }

        if (!password) {
            showAuthMessage(
                "비밀번호를 입력해주세요."
            );
            return;
        }


        if (
            authMode === "signup" &&
            !checkPassword(password)
        ) {

            showAuthMessage(
                "비밀번호 형식을 확인해주세요."
            );

            return;
        }


        const button =
            document.getElementById("authButton");

        const originalText =
            authMode === "login"
                ? "로그인"
                : "회원가입";

        button.disabled = true;
        button.textContent =
            authMode === "login"
                ? "로그인 중..."
                : "가입 중...";

        showAuthMessage("");


        try {

            let result;

            if (authMode === "signup") {

                result =
                    await supabaseClient.rpc(
                        "register_user",
                        {
                            p_name: name,
                            p_password: password
                        }
                    );

            } else {

                result =
                    await supabaseClient.rpc(
                        "login_user",
                        {
                            p_name: name,
                            p_password: password
                        }
                    );
            }


            if (result.error) {
                throw result.error;
            }


            if (!result.data) {

                throw new Error(
                    authMode === "login"
                        ? "로그인 정보가 올바르지 않습니다."
                        : "회원가입에 실패했습니다."
                );
            }


            let user = result.data;

            /*
                RPC가 배열로 반환되는 경우 처리
            */
            if (Array.isArray(user)) {
                user = user[0];
            }


            if (!user) {
                throw new Error(
                    "사용자 정보를 가져오지 못했습니다."
                );
            }


            currentUser = user;

            saveLogin(user);

            await openApp();

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error.message ||
                "처리 중 오류가 발생했습니다."
            );

        } finally {

            button.disabled = false;

            button.textContent =
                originalText;
        }

    });


/* =========================================================
   앱 열기
========================================================= */

async function openApp() {

    document
        .getElementById("authPage")
        .classList.add("hidden");

    document
        .getElementById("appPage")
        .classList.remove("hidden");

    window.scrollTo(0, 0);


    document
        .getElementById("userNameDisplay")
        .textContent =
            currentUser.name ||
            "사용자";


    await loadRecords();

    render();

    renderCalendar();
}


/* =========================================================
   기록 불러오기
========================================================= */

async function loadRecords() {

    if (!currentUser) {
        return;
    }


    const result =
        await supabaseClient
            .from("exercise_records")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "date",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "기록 불러오기 실패:",
            result.error
        );

        showToast(
            "운동 기록을 불러오지 못했습니다."
        );

        records = [];

        return;
    }


    records =
        result.data || [];
}


/* =========================================================
   재귀 함수
   전체 운동 시간 계산
========================================================= */

function sum(n) {

    if (n === 0) {
        return 0;
    }

    return (
        Number(records[n - 1].time) +
        sum(n - 1)
    );
}


/* =========================================================
   가장 오래 한 운동
========================================================= */

function getBest() {

    if (records.length === 0) {
        return null;
    }

    let best = records[0];

    for (let i = 1; i < records.length; i++) {

        if (
            Number(records[i].time) >
            Number(best.time)
        ) {
            best = records[i];
        }
    }

    return best;
}


/* =========================================================
   날짜 키
   YYYY-MM-DD
========================================================= */

function dateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   기록의 날짜 키
========================================================= */

function recordDateKey(record) {

    const date =
        new Date(record.date);

    return dateKey(date);
}


/* =========================================================
   오늘 통계
========================================================= */

function getTodayStats() {

    const today =
        dateKey(new Date());

    let total = 0;
    let count = 0;


    for (const record of records) {

        if (
            recordDateKey(record) ===
            today
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =========================================================
   이번 주 통계
   월요일 시작
========================================================= */

function getWeekStats() {

    const today =
        new Date();

    const start =
        new Date(today);

    const day =
        today.getDay();

    const diff =
        day === 0
            ? 6
            : day - 1;

    start.setDate(
        today.getDate() - diff
    );

    start.setHours(
        0,
        0,
        0,
        0
    );


    let total = 0;
    let count = 0;


    for (const record of records) {

        const recordDate =
            new Date(record.date);

        if (
            recordDate >= start &&
            recordDate <= today
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =========================================================
   이번 달 통계
========================================================= */

function getMonthStats() {

    const today =
        new Date();

    const start =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
            0,
            0,
            0,
            0
        );


    let total = 0;
    let count = 0;


    for (const record of records) {

        const recordDate =
            new Date(record.date);

        if (
            recordDate >= start &&
            recordDate <= today
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =========================================================
   날짜 표시
========================================================= */

function formatDate(dateString) {

    const date =
        new Date(dateString);

    return (
        `${date.getMonth() + 1}월 ` +
        `${date.getDate()}일`
    );
}


/* =========================================================
   운동 아이콘
========================================================= */

function getIcon(name) {

    const text =
        name.toLowerCase();

    if (
        text.includes("러닝") ||
        text.includes("달리") ||
        text.includes("런닝")
    ) {
        return "🏃";
    }

    if (
        text.includes("축구")
    ) {
        return "⚽";
    }

    if (
        text.includes("농구")
    ) {
        return "🏀";
    }

    if (
        text.includes("배구")
    ) {
        return "🏐";
    }

    if (
        text.includes("수영")
    ) {
        return "🏊";
    }

    if (
        text.includes("자전거") ||
        text.includes("사이클")
    ) {
        return "🚴";
    }

    if (
        text.includes("헬스") ||
        text.includes("웨이트") ||
        text.includes("근력")
    ) {
        return "🏋️";
    }

    if (
        text.includes("걷기")
    ) {
        return "🚶";
    }

    if (
        text.includes("요가")
    ) {
        return "🧘";
    }

    return "🏃";
}


/* =========================================================
   화면 렌더링
========================================================= */

function render() {

    const total =
        records.length === 0
            ? 0
            : sum(records.length);


    const count =
        records.length;


    const average =
        count === 0
            ? 0
            : Math.round(
                total / count
            );


    const best =
        getBest();


    const today =
        getTodayStats();


    const week =
        getWeekStats();


    const month =
        getMonthStats();


    /* 전체 */

    document.getElementById(
        "totalTime"
    ).textContent =
        `${total}분`;


    document.getElementById(
        "recordCount"
    ).textContent =
        `총 ${count}회 기록`;


    /* 평균 */

    document.getElementById(
        "averageTime"
    ).textContent =
        `${average}분`;


    document.getElementById(
        "summaryCount"
    ).textContent =
        `${count}회`;


    /* 최고 기록 */

    document.getElementById(
        "bestWorkout"
    ).textContent =
        best
            ? best.name
            : "-";


    /* 오늘 */

    document.getElementById(
        "todayTime"
    ).textContent =
        `${today.total}분`;


    document.getElementById(
        "todayCount"
    ).textContent =
        `${today.count}회 기록`;


    /* 주간 */

    document.getElementById(
        "weekTime"
    ).textContent =
        `${week.total}분`;


    document.getElementById(
        "weekCount"
    ).textContent =
        `${week.count}회 기록`;


    /* 월간 */

    document.getElementById(
        "monthTime"
    ).textContent =
        `${month.total}분`;


    document.getElementById(
        "monthCount"
    ).textContent =
        `${month.count}회 기록`;


    /* 기록 수 */

    document.getElementById(
        "historyCount"
    ).textContent =
        `${count}개`;


    renderRecords();
}


/* =========================================================
   운동 기록 목록
========================================================= */

function renderRecords() {

    const list =
        document.getElementById(
            "recordList"
        );


    if (records.length === 0) {

        list.innerHTML = `
            <div class="empty-record">
                아직 운동 기록이 없습니다.
            </div>
        `;

        return;
    }


    list.innerHTML =
        records
            .map(record => {

                return `
                    <div
                        class="record-item"
                    >

                        <div class="record-icon">
                            ${getIcon(record.name)}
                        </div>

                        <div class="record-info">

                            <span class="record-name">
                                ${escapeHTML(record.name)}
                            </span>

                            <span class="record-date">
                                ${formatDate(record.date)}
                            </span>

                        </div>

                        <strong class="record-time">
                            ${Number(record.time)}분
                        </strong>

                        <button
                            class="delete-record"
                            data-id="${record.id}"
                        >
                            ×
                        </button>

                    </div>
                `;

            })
            .join("");


    document
        .querySelectorAll(".delete-record")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteRecord(
                        button.dataset.id
                    );

                }
            );

        });
}


/* =========================================================
   HTML 문자 처리
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   운동 기록 추가
========================================================= */

document.getElementById(
    "exerciseForm"
).addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            showToast(
                "로그인이 필요합니다."
            );

            return;
        }


        const name =
            document
                .getElementById("exerciseName")
                .value
                .trim();


        const time =
            Number(
                document
                    .getElementById("exerciseTime")
                    .value
            );


        if (!name) {

            showToast(
                "운동 이름을 입력해주세요."
            );

            return;
        }


        if (
            !Number.isFinite(time) ||
            time <= 0
        ) {

            showToast(
                "운동 시간을 확인해주세요."
            );

            return;
        }


        const result =
            await supabaseClient
                .from("exercise_records")
                .insert({
                    user_id:
                        currentUser.id,

                    name:
                        name,

                    time:
                        time,

                    date:
                        new Date().toISOString()
                })
                .select()
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            showToast(
                "운동 기록 저장에 실패했습니다."
            );

            return;
        }


        records.unshift(
            result.data
        );


        render();

        renderCalendar();


        document
            .getElementById("exerciseForm")
            .reset();


        closeModal(
            "modal"
        );


        showToast(
            "운동 기록이 저장되었습니다."
        );

    }
);


/* =========================================================
   기록 삭제
========================================================= */

async function deleteRecord(id) {

    const result =
        await supabaseClient
            .from("exercise_records")
            .delete()
            .eq("id", id)
            .eq(
                "user_id",
                currentUser.id
            );


    if (result.error) {

        console.error(
            result.error
        );

        showToast(
            "기록 삭제에 실패했습니다."
        );

        return;
    }


    records =
        records.filter(
            record =>
                String(record.id) !==
                String(id)
        );


    render();

    renderCalendar();

    showToast(
        "기록이 삭제되었습니다."
    );
}


/* =========================================================
   전체 삭제
========================================================= */

document.getElementById(
    "clearAllButton"
).addEventListener(
    "click",
    async () => {

        if (records.length === 0) {

            showToast(
                "삭제할 기록이 없습니다."
            );

            return;
        }


        const ok =
            confirm(
                "모든 운동 기록을 삭제하시겠습니까?"
            );


        if (!ok) {
            return;
        }


        const result =
            await supabaseClient
                .from("exercise_records")
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (result.error) {

            console.error(
                result.error
            );

            showToast(
                "전체 삭제에 실패했습니다."
            );

            return;
        }


        records = [];

        render();

        renderCalendar();

        showToast(
            "모든 운동 기록을 삭제했습니다."
        );
    }
);


/* =========================================================
   기록 추가 모달
========================================================= */

document.getElementById(
    "addButton"
).addEventListener(
    "click",
    () => {

        document
            .getElementById("modal")
            .classList.remove("hidden");

        setTimeout(
            () => {
                document
                    .getElementById("exerciseName")
                    .focus();
            },
            50
        );
    }
);


document.getElementById(
    "closeModalButton"
).addEventListener(
    "click",
    () => {
        closeModal("modal");
    }
);


/* 배경 클릭 */

document
    .querySelector("#modal .modal-backdrop")
    .addEventListener(
        "click",
        () => {
            closeModal("modal");
        }
    );


/* =========================================================
   달력
========================================================= */

function renderCalendar() {

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    document.getElementById(
        "calendarTitle"
    ).textContent =
        `${year}년 ${month + 1}월`;


    const grid =
        document.getElementById(
            "calendarGrid"
        );


    grid.innerHTML = "";


    /*
        월요일 시작
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    let startDay =
        firstDay.getDay();


    startDay =
        startDay === 0
            ? 6
            : startDay - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    const totalCells =
        Math.ceil(
            (
                startDay +
                daysInMonth
            ) / 7
        ) * 7;


    for (
        let i = 0;
        i < totalCells;
        i++
    ) {

        let day;
        let cellDate;
        let otherMonth = false;


        if (i < startDay) {

            day =
                previousMonthDays -
                startDay +
                i +
                1;

            cellDate =
                new Date(
                    year,
                    month - 1,
                    day
                );

            otherMonth = true;

        } else if (
            i >=
            startDay +
            daysInMonth
        ) {

            day =
                i -
                (
                    startDay +
                    daysInMonth
                ) +
                1;

            cellDate =
                new Date(
                    year,
                    month + 1,
                    day
                );

            otherMonth = true;

        } else {

            day =
                i -
                startDay +
                1;

            cellDate =
                new Date(
                    year,
                    month,
                    day
                );
        }


        const key =
            dateKey(cellDate);


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "calendar-day";


        button.textContent =
            day;


        button.dataset.date =
            key;


        if (otherMonth) {
            button.classList.add(
                "other-month"
            );
        }


        if (
            key ===
            dateKey(new Date())
        ) {
            button.classList.add(
                "today"
            );
        }


        const hasRecord =
            records.some(
                record =>
                    recordDateKey(record) ===
                    key
            );


        if (hasRecord) {

            button.classList.add(
                "has-record"
            );
        }


        button.addEventListener(
            "click",
            () => {

                openDayModal(
                    cellDate
                );

            }
        );


        grid.appendChild(
            button
        );
    }
}


/* 이전 달 */

document.getElementById(
    "prevMonthButton"
).addEventListener(
    "click",
    () => {

        calendarDate.setMonth(
            calendarDate.getMonth() - 1
        );

        renderCalendar();
    }
);


/* 다음 달 */

document.getElementById(
    "nextMonthButton"
).addEventListener(
    "click",
    () => {

        calendarDate.setMonth(
            calendarDate.getMonth() + 1
        );

        renderCalendar();
    }
);


/* =========================================================
   날짜 상세
========================================================= */

function openDayModal(date) {

    const key =
        dateKey(date);


    const dayRecords =
        records.filter(
            record =>
                recordDateKey(record) ===
                key
        );


    let total = 0;


    for (const record of dayRecords) {

        total +=
            Number(record.time);
    }


    const count =
        dayRecords.length;


    const average =
        count === 0
            ? 0
            : Math.round(
                total / count
            );


    document.getElementById(
        "dayModalTitle"
    ).textContent =
        `${date.getFullYear()}년 ${
            date.getMonth() + 1
        }월 ${
            date.getDate()
        }일`;


    document.getElementById(
        "dayTotalTime"
    ).textContent =
        `${total}분`;


    document.getElementById(
        "dayRecordCount"
    ).textContent =
        `${count}회`;


    document.getElementById(
        "dayAverageTime"
    ).textContent =
        `${average}분`;


    const list =
        document.getElementById(
            "dayRecordList"
        );


    if (dayRecords.length === 0) {

        list.innerHTML = `
            <div class="empty-record">
                이 날짜에는 운동 기록이 없습니다.
            </div>
        `;

    } else {

        list.innerHTML =
            dayRecords
                .map(record => {

                    return `
                        <div class="day-record-item">

                            <span>
                                ${getIcon(record.name)}
                                ${escapeHTML(record.name)}
                            </span>

                            <strong>
                                ${Number(record.time)}분
                            </strong>

                        </div>
                    `;

                })
                .join("");
    }


    document
        .getElementById("dayModal")
        .classList.remove("hidden");
}


/* 날짜 모달 닫기 */

document.getElementById(
    "closeDayModalButton"
).addEventListener(
    "click",
    () => {

        closeModal(
            "dayModal"
        );
    }
);


document
    .querySelector("#dayModal .modal-backdrop")
    .addEventListener(
        "click",
        () => {

            closeModal(
                "dayModal"
            );
        }
    );


/* =========================================================
   통계
========================================================= */

document.getElementById(
    "statisticsButton"
).addEventListener(
    "click",
    () => {

        renderStatistics();

        document
            .getElementById(
                "statisticsModal"
            )
            .classList.remove(
                "hidden"
            );
    }
);


document.getElementById(
    "closeStatisticsButton"
).addEventListener(
    "click",
    () => {

        closeModal(
            "statisticsModal"
        );
    }
);


document
    .querySelector(
        "#statisticsModal .modal-backdrop"
    )
    .addEventListener(
        "click",
        () => {

            closeModal(
                "statisticsModal"
            );
        }
    );


/* =========================================================
   통계 화면 생성
========================================================= */

function renderStatistics() {

    const total =
        records.length === 0
            ? 0
            : sum(records.length);


    const count =
        records.length;


    const average =
        count === 0
            ? 0
            : Math.round(
                total / count
            );


    const best =
        getBest();


    document.getElementById(
        "statisticsTotal"
    ).textContent =
        `${total}분`;


    document.getElementById(
        "statisticsCount"
    ).textContent =
        `${count}회`;


    document.getElementById(
        "statisticsAverage"
    ).textContent =
        `${average}분`;


    document.getElementById(
        "statisticsBest"
    ).textContent =
        best
            ? best.name
            : "-";


    renderWeeklyChart();

    renderExerciseStatistics();
}


/* =========================================================
   최근 7일 차트
========================================================= */

function renderWeeklyChart() {

    const chart =
        document.getElementById(
            "weeklyChart"
        );


    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        days.push(date);
    }


    const values =
        days.map(
            date => {

                const key =
                    dateKey(date);

                return records
                    .filter(
                        record =>
                            recordDateKey(record) ===
                            key
                    )
                    .reduce(
                        (
                            total,
                            record
                        ) =>
                            total +
                            Number(
                                record.time
                            ),
                        0
                    );
            }
        );


    const max =
        Math.max(
            ...values,
            1
        );


    chart.innerHTML =
        days
            .map(
                (
                    date,
                    index
                ) => {

                    const value =
                        values[index];


                    const height =
                        value === 0
                            ? 2
                            : Math.max(
                                6,
                                (
                                    value /
                                    max
                                ) *
                                100
                            );


                    const dayName =
                        [
                            "일",
                            "월",
                            "화",
                            "수",
                            "목",
                            "금",
                            "토"
                        ][
                            date.getDay()
                        ];


                    return `
                        <div class="chart-column">

                            <span class="chart-value">
                                ${value}분
                            </span>

                            <div class="chart-bar-wrap">

                                <div
                                    class="chart-bar"
                                    style="height:${height}%"
                                ></div>

                            </div>

                            <span class="chart-day">
                                ${dayName}
                            </span>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   운동 종류별 통계
========================================================= */

function renderExerciseStatistics() {

    const container =
        document.getElementById(
            "exerciseStatistics"
        );


    if (records.length === 0) {

        container.innerHTML = `
            <div class="empty-record">
                아직 통계를 만들 기록이 없습니다.
            </div>
        `;

        return;
    }


    const exerciseMap = {};


    for (const record of records) {

        if (!exerciseMap[record.name]) {

            exerciseMap[record.name] = {
                count: 0,
                total: 0
            };
        }


        exerciseMap[record.name].count++;

        exerciseMap[record.name].total +=
            Number(record.time);
    }


    const list =
        Object.entries(
            exerciseMap
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1].total -
                a[1].total
        );


    const max =
        list.length > 0
            ? list[0][1].total
            : 1;


    container.innerHTML =
        list
            .map(
                ([name, data]) => {

                    const width =
                        Math.max(
                            5,
                            (
                                data.total /
                                max
                            ) *
                            100
                        );


                    return `
                        <div class="exercise-stat-row">

                            <span class="exercise-stat-name">
                                ${escapeHTML(name)}
                            </span>

                            <div class="exercise-stat-bar-wrap">

                                <div
                                    class="exercise-stat-bar"
                                    style="width:${width}%"
                                ></div>

                            </div>

                            <span class="exercise-stat-time">
                                ${data.total}분
                            </span>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   테마
========================================================= */

const themeButton =
    document.getElementById(
        "themeButton"
    );


function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light"
        );

        themeButton.textContent =
            "☀";

    } else {

        document.body.classList.remove(
            "light"
        );

        themeButton.textContent =
            "☾";
    }
}


const savedTheme =
    localStorage.getItem(
        "workoutTheme"
    ) || "dark";


applyTheme(savedTheme);


themeButton.addEventListener(
    "click",
    () => {

        const isLight =
            document.body.classList.contains(
                "light"
            );


        const nextTheme =
            isLight
                ? "dark"
                : "light";


        localStorage.setItem(
            "workoutTheme",
            nextTheme
        );


        applyTheme(
            nextTheme
        );
    }
);


/* =========================================================
   로그아웃
========================================================= */

document.getElementById(
    "logoutButton"
).addEventListener(
    "click",
    () => {

        removeLogin();

        currentUser = null;

        records = [];


        document
            .getElementById("appPage")
            .classList.add("hidden");


        document
            .getElementById("authPage")
            .classList.remove("hidden");


        document
            .getElementById("authName")
            .value = "";


        document
            .getElementById("authPassword")
            .value = "";


        showAuthMessage("");

        window.scrollTo(
            0,
            0
        );
    }
);


/* =========================================================
   모달 닫기
========================================================= */

function closeModal(id) {

    document
        .getElementById(id)
        .classList.add(
            "hidden"
        );
}


/* =========================================================
   Toast
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   ESC로 모달 닫기
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        closeModal("modal");
        closeModal("dayModal");
        closeModal("statisticsModal");
    }
);


/* =========================================================
   시작
========================================================= */

async function start() {

    const savedUser =
        loadLogin();


    if (savedUser) {

        currentUser =
            savedUser;

        await openApp();

    } else {

        document
            .getElementById("authPage")
            .classList.remove("hidden");

        document
            .getElementById("appPage")
            .classList.add("hidden");
    }
}


start();
