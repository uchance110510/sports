// ==================================================
// Supabase 설정
// ==================================================

const SUPABASE_URL =
    "https://wctknuijnyxbzpdplgrz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QjOYrVQHQuqpF8n8hsk_3Q__QEbvwhI";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==================================================
// 전역 변수
// ==================================================

let currentUser = null;

let records = [];

let authMode = "login";


// ==================================================
// 로그인 정보 저장
// ==================================================

function saveLogin(user) {

    localStorage.setItem(
        "workoutUser",
        JSON.stringify(user)
    );

}


// ==================================================
// 로그인 정보 불러오기
// ==================================================

function loadLogin() {

    const saved =
        localStorage.getItem(
            "workoutUser"
        );

    if (!saved) {
        return null;
    }

    try {

        return JSON.parse(saved);

    } catch {

        return null;

    }

}


// ==================================================
// 로그아웃 정보 삭제
// ==================================================

function removeLogin() {

    localStorage.removeItem(
        "workoutUser"
    );

}


// ==================================================
// 비밀번호 검사
// ==================================================

function checkPassword(password) {

    if (password.length < 6) {

        return (
            "비밀번호는 6자 이상이어야 합니다."
        );

    }


    if (/\s/.test(password)) {

        return (
            "비밀번호에는 공백을 사용할 수 없습니다."
        );

    }


    if (
        !/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};:,.<>?]+$/.test(
            password
        )
    ) {

        return (
            "비밀번호는 영어, 숫자, 특수문자만 사용할 수 있습니다."
        );

    }


    if (!/[A-Za-z]/.test(password)) {

        return (
            "비밀번호에 영어가 필요합니다."
        );

    }


    if (!/[0-9]/.test(password)) {

        return (
            "비밀번호에 숫자가 필요합니다."
        );

    }


    if (!/[^A-Za-z0-9]/.test(password)) {

        return (
            "비밀번호에 특수문자가 필요합니다."
        );

    }


    return null;

}


// ==================================================
// 로그인 메시지
// ==================================================

function showAuthMessage(message) {

    document
        .getElementById("authMessage")
        .textContent = message;

}


// ==================================================
// 로그인 탭
// ==================================================

document
    .getElementById("loginTab")
    .addEventListener(
        "click",
        function () {

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
                .getElementById("authTitle")
                .textContent =
                    "다시 만나서 반가워요";


            document
                .getElementById("authPassword")
                .autocomplete =
                    "current-password";


            showAuthMessage("");

        }
    );


// ==================================================
// 회원가입 탭
// ==================================================

document
    .getElementById("signupTab")
    .addEventListener(
        "click",
        function () {

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
                .getElementById("authTitle")
                .textContent =
                    "새로운 기록을 시작하세요";


            document
                .getElementById("authPassword")
                .autocomplete =
                    "new-password";


            showAuthMessage("");

        }
    );


// ==================================================
// 로그인 / 회원가입
// ==================================================

document
    .getElementById("authButton")
    .addEventListener(
        "click",
        async function () {

            const button =
                document.getElementById(
                    "authButton"
                );


            if (button.disabled) {
                return;
            }


            const name =
                document
                    .getElementById(
                        "authName"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "authPassword"
                    )
                    .value;


            if (name === "") {

                showAuthMessage(
                    "이름을 입력해주세요."
                );

                return;

            }


            if (name.length < 2) {

                showAuthMessage(
                    "이름은 2글자 이상 입력해주세요."
                );

                return;

            }


            if (
                authMode === "signup"
            ) {

                const passwordError =
                    checkPassword(
                        password
                    );


                if (passwordError) {

                    showAuthMessage(
                        passwordError
                    );

                    return;

                }

            }


            button.disabled = true;


            const originalText =
                authMode === "signup"
                    ? "회원가입"
                    : "로그인";


            button.textContent =
                authMode === "signup"
                    ? "회원가입 중..."
                    : "로그인 중...";


            try {

                // ==========================================
                // 회원가입
                // ==========================================

                if (
                    authMode === "signup"
                ) {

                    const result =
                        await Promise.race([

                            supabaseClient.rpc(
                                "register_user",
                                {
                                    p_name:
                                        name,

                                    p_password:
                                        password
                                }
                            ),

                            new Promise(
                                (_, reject) =>

                                    setTimeout(
                                        () =>

                                            reject(
                                                new Error(
                                                    "서버 응답 시간이 초과되었습니다."
                                                )
                                            ),

                                        10000
                                    )
                            )

                        ]);


                    if (result.error) {

                        console.error(
                            "회원가입 오류:",
                            result.error
                        );

                        showAuthMessage(
                            result.error.message
                        );

                        return;

                    }


                    if (!result.data) {

                        showAuthMessage(
                            "회원가입에 실패했습니다."
                        );

                        return;

                    }


                    currentUser =
                        result.data;


                    saveLogin(
                        currentUser
                    );


                    await openApp();

                    return;

                }


                // ==========================================
                // 로그인
                // ==========================================

                const result =
                    await Promise.race([

                        supabaseClient.rpc(
                            "login_user",
                            {
                                p_name:
                                    name,

                                p_password:
                                    password
                            }
                        ),

                        new Promise(
                            (_, reject) =>

                                setTimeout(
                                    () =>

                                        reject(
                                            new Error(
                                                "서버 응답 시간이 초과되었습니다."
                                            )
                                        ),

                                    10000
                                )
                        )

                    ]);


                if (result.error) {

                    console.error(
                        "로그인 오류:",
                        result.error
                    );

                    showAuthMessage(
                        result.error.message
                    );

                    return;

                }


                if (!result.data) {

                    showAuthMessage(
                        "이름 또는 비밀번호가 틀렸습니다."
                    );

                    return;

                }


                currentUser =
                    result.data;


                saveLogin(
                    currentUser
                );


                await openApp();


            } catch (error) {

                console.error(
                    "로그인/회원가입 오류:",
                    error
                );


                showAuthMessage(
                    error?.message ||
                    "오류가 발생했습니다."
                );


            } finally {

                button.disabled = false;

                if (
                    document
                        .getElementById(
                            "authPage"
                        )
                        .classList
                        .contains(
                            "hidden"
                        )
                ) {

                    button.textContent =
                        originalText;

                } else {

                    button.textContent =
                        authMode === "signup"
                            ? "회원가입"
                            : "로그인";

                }

            }

        }
    );


// ==================================================
// 앱 열기
// ==================================================

async function openApp() {

    document
        .getElementById("authPage")
        .classList.add("hidden");


    document
        .getElementById("statsPage")
        .classList.add("hidden");


    document
        .getElementById("appPage")
        .classList.remove("hidden");


    document
        .getElementById(
            "userNameDisplay"
        )
        .textContent =
            currentUser.name +
            "님";


    window.scrollTo(
        0,
        0
    );


    await loadRecords();

}


// ==================================================
// 운동 기록 불러오기
// ==================================================

async function loadRecords() {

    if (!currentUser) {
        return;
    }


    const result =
        await supabaseClient
            .from(
                "exercise_records"
            )
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "date",
                {
                    ascending: true
                }
            );


    if (result.error) {

        console.error(
            "기록 불러오기 오류:",
            result.error
        );


        alert(
            "운동 기록을 불러오지 못했습니다."
        );

        return;

    }


    records =
        result.data || [];


    render();

}


// ==================================================
// 전체 운동 시간
// 재귀 함수
// ==================================================

function sum(n) {

    if (n === 0) {
        return 0;
    }


    return (
        Number(
            records[n - 1].time
        ) +
        sum(n - 1)
    );

}


// ==================================================
// 가장 오래 한 운동
// ==================================================

function getBest() {

    if (
        records.length === 0
    ) {

        return null;

    }


    let best =
        records[0];


    for (
        let i = 1;
        i < records.length;
        i++
    ) {

        if (
            Number(
                records[i].time
            ) >
            Number(
                best.time
            )
        ) {

            best =
                records[i];

        }

    }


    return best;

}


// ==================================================
// 날짜 시작
// ==================================================

function startOfDay(date) {

    const result =
        new Date(date);


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


// ==================================================
// 오늘 통계
// ==================================================

function getTodayStats() {

    const today =
        startOfDay(
            new Date()
        );


    let total = 0;

    let count = 0;


    for (
        const record of records
    ) {

        const date =
            startOfDay(
                new Date(
                    record.date
                )
            );


        if (
            date.getTime() ===
            today.getTime()
        ) {

            total +=
                Number(
                    record.time
                );

            count++;

        }

    }


    return {
        total,
        count
    };

}


// ==================================================
// 이번 주 통계
// 월요일 ~ 오늘
// ==================================================

function getWeekStats() {

    const today =
        new Date();


    const day =
        today.getDay();


    const diff =
        day === 0
            ? 6
            : day - 1;


    const start =
        new Date(today);


    start.setDate(
        today.getDate() -
        diff
    );


    start.setHours(
        0,
        0,
        0,
        0
    );


    let total = 0;

    let count = 0;


    for (
        const record of records
    ) {

        const date =
            new Date(
                record.date
            );


        if (
            date >= start &&
            date <= today
        ) {

            total +=
                Number(
                    record.time
                );

            count++;

        }

    }


    return {
        total,
        count
    };

}


// ==================================================
// 이번 달 통계
// ==================================================

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


    for (
        const record of records
    ) {

        const date =
            new Date(
                record.date
            );


        if (
            date >= start &&
            date <= today
        ) {

            total +=
                Number(
                    record.time
                );

            count++;

        }

    }


    return {
        total,
        count
    };

}


// ==================================================
// 날짜 표시
// ==================================================

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString
        );


    return (
        (date.getMonth() + 1) +
        "월 " +
        date.getDate() +
        "일"
    );

}


// ==================================================
// 운동 아이콘
// ==================================================

function getIcon(name) {

    if (
        name.includes("농구")
    ) {
        return "🏀";
    }


    if (
        name.includes("축구")
    ) {
        return "⚽";
    }


    if (
        name.includes("줄넘기")
    ) {
        return "🪢";
    }


    if (
        name.includes("자전거")
    ) {
        return "🚴";
    }


    if (
        name.includes("수영")
    ) {
        return "🏊";
    }


    if (
        name.includes("팔굽혀펴기") ||
        name.includes("푸쉬업")
    ) {
        return "💪";
    }


    if (
        name.includes("걷기")
    ) {
        return "🚶";
    }


    if (
        name.includes("달리기") ||
        name.includes("러닝")
    ) {
        return "🏃";
    }


    return "🏃";

}


// ==================================================
// 메인 화면 렌더링
// ==================================================

function render() {

    const total =
        records.length > 0
            ? sum(
                records.length
            )
            : 0;


    // 전체 시간

    document
        .getElementById(
            "totalTime"
        )
        .textContent =
            total;


    // 전체 기록

    document
        .getElementById(
            "recordCount"
        )
        .textContent =
            records.length;


    // 평균

    const average =
        records.length > 0
            ? total /
              records.length
            : 0;


    document
        .getElementById(
            "averageTime"
        )
        .textContent =
            average.toFixed(1);


    // 최고 기록

    const best =
        getBest();


    if (best) {

        document
            .getElementById(
                "bestName"
            )
            .textContent =
                best.name;

    } else {

        document
            .getElementById(
                "bestName"
            )
            .textContent =
                "-";

    }


    // 오늘

    const today =
        getTodayStats();


    document
        .getElementById(
            "todayTime"
        )
        .textContent =
            today.total +
            "분";


    document
        .getElementById(
            "todayCount"
        )
        .textContent =
            today.count +
            "회 기록";


    // 주간

    const week =
        getWeekStats();


    document
        .getElementById(
            "weekTime"
        )
        .textContent =
            week.total +
            "분";


    document
        .getElementById(
            "weekCount"
        )
        .textContent =
            week.count +
            "회 기록";


    // 월간

    const month =
        getMonthStats();


    document
        .getElementById(
            "monthTime"
        )
        .textContent =
            month.total +
            "분";


    document
        .getElementById(
            "monthCount"
        )
        .textContent =
            month.count +
            "회 기록";


    // 기록 목록

    renderRecordList();

}


// ==================================================
// 메인 기록 목록
// ==================================================

function renderRecordList() {

    const list =
        document.getElementById(
            "recordList"
        );


    list.innerHTML = "";


    if (
        records.length === 0
    ) {

        document
            .getElementById(
                "recordStatus"
            )
            .textContent =
                "아직 기록이 없어요.";


        list.innerHTML =
            `
            <div class="record-empty">
                아직 운동 기록이 없습니다.<br>
                첫 번째 운동을 기록해보세요.
            </div>
            `;

        return;

    }


    document
        .getElementById(
            "recordStatus"
        )
        .textContent =
            records.length +
            "개";


    for (
        let i =
            records.length - 1;
        i >= 0;
        i--
    ) {

        const record =
            records[i];


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "record";


        // 아이콘

        const icon =
            document.createElement(
                "div"
            );


        icon.className =
            "record-icon";


        icon.textContent =
            getIcon(
                record.name
            );


        // 이름 / 날짜

        const info =
            document.createElement(
                "div"
            );


        info.className =
            "record-info";


        const name =
            document.createElement(
                "strong"
            );


        name.textContent =
            record.name;


        const date =
            document.createElement(
                "small"
            );


        date.textContent =
            formatDate(
                record.date
            );


        info.appendChild(
            name
        );

        info.appendChild(
            date
        );


        // 시간

        const time =
            document.createElement(
                "div"
            );


        time.className =
            "record-time";


        time.textContent =
            record.time +
            "분";


        // 삭제

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "delete-button";


        deleteButton.textContent =
            "×";


        deleteButton.addEventListener(
            "click",
            function () {

                deleteRecord(
                    record.id
                );

            }
        );


        div.appendChild(
            icon
        );

        div.appendChild(
            info
        );

        div.appendChild(
            time
        );

        div.appendChild(
            deleteButton
        );


        list.appendChild(
            div
        );

    }

}


// ==================================================
// 운동 기록 추가
// ==================================================

document
    .getElementById(
        "exerciseForm"
    )
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "로그인해주세요."
                );

                return;

            }


            const name =
                document
                    .getElementById(
                        "nameInput"
                    )
                    .value
                    .trim();


            const time =
                Number(
                    document
                        .getElementById(
                            "timeInput"
                        )
                        .value
                );


            if (name === "") {

                alert(
                    "운동 이름을 입력해주세요."
                );

                return;

            }


            if (
                !Number.isFinite(
                    time
                ) ||
                time <= 0
            ) {

                alert(
                    "운동 시간을 올바르게 입력해주세요."
                );

                return;

            }


            const submitButton =
                event
                    .target
                    .querySelector(
                        "button[type='submit']"
                    );


            submitButton.disabled =
                true;


            submitButton.textContent =
                "저장 중...";


            try {

                const result =
                    await supabaseClient
                        .from(
                            "exercise_records"
                        )
                        .insert({

                            user_id:
                                currentUser.id,

                            name:
                                name,

                            time:
                                time,

                            date:
                                new Date()
                                    .toISOString()

                        })
                        .select()
                        .single();


                if (
                    result.error
                ) {

                    console.error(
                        "운동 기록 저장 오류:",
                        result.error
                    );


                    alert(
                        "운동 기록 저장에 실패했습니다.\n\n" +
                        result.error.message
                    );

                    return;

                }


                records.push(
                    result.data
                );


                render();


                document
                    .getElementById(
                        "nameInput"
                    )
                    .value = "";


                document
                    .getElementById(
                        "timeInput"
                    )
                    .value = "";


                closeModal();


                showToast();


                // 통계 화면이 열려 있었다면 갱신

                if (
                    !document
                        .getElementById(
                            "statsPage"
                        )
                        .classList
                        .contains(
                            "hidden"
                        )
                ) {

                    renderStats();

                }


            } finally {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "기록 저장";

            }

        }
    );


// ==================================================
// 운동 기록 삭제
// ==================================================

async function deleteRecord(id) {

    const answer =
        confirm(
            "이 운동 기록을 삭제할까요?"
        );


    if (!answer) {
        return;
    }


    const result =
        await supabaseClient
            .from(
                "exercise_records"
            )
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (result.error) {

        console.error(
            "삭제 오류:",
            result.error
        );


        alert(
            "삭제에 실패했습니다."
        );

        return;

    }


    records =
        records.filter(
            record =>
                record.id !== id
        );


    render();


    if (
        !document
            .getElementById(
                "statsPage"
            )
            .classList
            .contains(
                "hidden"
            )
    ) {

        renderStats();

    }

}


// ==================================================
// 전체 삭제
// ==================================================

async function clearAllRecords() {

    if (
        records.length === 0
    ) {

        alert(
            "삭제할 기록이 없습니다."
        );

        return;

    }


    const answer =
        confirm(
            "모든 운동 기록을 삭제할까요?"
        );


    if (!answer) {
        return;
    }


    const result =
        await supabaseClient
            .from(
                "exercise_records"
            )
            .delete()
            .eq(
                "user_id",
                currentUser.id
            );


    if (result.error) {

        console.error(
            "전체 삭제 오류:",
            result.error
        );


        alert(
            "삭제에 실패했습니다."
        );

        return;

    }


    records = [];


    render();


    if (
        !document
            .getElementById(
                "statsPage"
            )
            .classList
            .contains(
                "hidden"
            )
    ) {

        renderStats();

    }

}


// ==================================================
// 운동 추가 모달
// ==================================================

document
    .getElementById(
        "addButton"
    )
    .addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "modal"
                )
                .classList
                .remove(
                    "hidden"
                );


            document
                .getElementById(
                    "nameInput"
                )
                .focus();

        }
    );


// ==================================================
// 모달 닫기
// ==================================================

function closeModal() {

    document
        .getElementById(
            "modal"
        )
        .classList
        .add(
            "hidden"
        );

}


document
    .getElementById(
        "closeButton"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "modalBackground"
    )
    .addEventListener(
        "click",
        closeModal
    );


// ==================================================
// 전체 삭제
// ==================================================

document
    .getElementById(
        "clearButton"
    )
    .addEventListener(
        "click",
        clearAllRecords
    );


// ==================================================
// 로그아웃
// ==================================================

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        function () {

            currentUser = null;

            records = [];


            removeLogin();


            document
                .getElementById(
                    "appPage"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "statsPage"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "authPage"
                )
                .classList
                .remove(
                    "hidden"
                );


            document
                .getElementById(
                    "authName"
                )
                .value = "";


            document
                .getElementById(
                    "authPassword"
                )
                .value = "";


            showAuthMessage("");


            window.scrollTo(
                0,
                0
            );

        }
    );


// ==================================================
// 통계 페이지 열기
// ==================================================

document
    .getElementById(
        "statsButton"
    )
    .addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "appPage"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "statsPage"
                )
                .classList
                .remove(
                    "hidden"
                );


            renderStats();


            window.scrollTo(
                0,
                0
            );

        }
    );


// ==================================================
// 통계 페이지 뒤로가기
// ==================================================

document
    .getElementById(
        "statsBackButton"
    )
    .addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "statsPage"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "appPage"
                )
                .classList
                .remove(
                    "hidden"
                );


            window.scrollTo(
                0,
                0
            );

        }
    );


// ==================================================
// 최근 N주 데이터
// ==================================================

function getWeeklyData(
    weeks
) {

    const result = [];

    const today =
        new Date();


    for (
        let i = weeks - 1;
        i >= 0;
        i--
    ) {

        const end =
            new Date(
                today
            );


        end.setDate(
            today.getDate() -
            i * 7
        );


        end.setHours(
            23,
            59,
            59,
            999
        );


        const start =
            new Date(
                end
            );


        start.setDate(
            end.getDate() -
            6
        );


        start.setHours(
            0,
            0,
            0,
            0
        );


        let total = 0;

        let count = 0;


        for (
            const record of records
        ) {

            const date =
                new Date(
                    record.date
                );


            if (
                date >= start &&
                date <= end
            ) {

                total +=
                    Number(
                        record.time
                    );

                count++;

            }

        }


        result.push({

            start,
            end,

            total,

            count

        });

    }


    return result;

}


// ==================================================
// 운동 유형 데이터
// ==================================================

function getExerciseTypeData() {

    const map = {};


    for (
        const record of records
    ) {

        const name =
            record.name.trim();


        if (!name) {
            continue;
        }


        if (
            !map[name]
        ) {

            map[name] = 0;

        }


        map[name]++;

    }


    return Object
        .entries(map)
        .sort(
            (a, b) =>
                b[1] - a[1]
        );

}


// ==================================================
// 통계 화면
// ==================================================

function renderStats() {

    const total =
        records.length > 0
            ? sum(
                records.length
            )
            : 0;


    const count =
        records.length;


    const average =
        count > 0
            ? total / count
            : 0;


    const best =
        getBest();


    // ----------------------------------------------
    // 요약
    // ----------------------------------------------

    document
        .getElementById(
            "statsTotalTime"
        )
        .textContent =
            total +
            "분";


    document
        .getElementById(
            "statsRecordCount"
        )
        .textContent =
            count;


    document
        .getElementById(
            "statsAverageTime"
        )
        .textContent =
            average.toFixed(1) +
            "분";


    document
        .getElementById(
            "statsBestTime"
        )
        .textContent =
            best
                ? best.time +
                  "분"
                : "0분";


    document
        .getElementById(
            "statsBestName"
        )
        .textContent =
            best
                ? best.name
                : "-";


    // ----------------------------------------------
    // 주간 차트
    // ----------------------------------------------

    renderWeeklyChart();


    // ----------------------------------------------
    // 운동 종류
    // ----------------------------------------------

    renderExerciseTypes();


    // ----------------------------------------------
    // 최근 기록
    // ----------------------------------------------

    renderRecentStats();

}


// ==================================================
// 주간 차트 렌더링
// ==================================================

function renderWeeklyChart() {

    const weeks =
        Number(
            document
                .getElementById(
                    "statsPeriod"
                )
                .value
        );


    const data =
        getWeeklyData(
            weeks
        );


    const chart =
        document
            .getElementById(
                "weeklyChart"
            );


    chart.innerHTML = "";


    let max =
        1;


    for (
        const item of data
    ) {

        if (
            item.total >
            max
        ) {

            max =
                item.total;

        }

    }


    data.forEach(
        function (
            item,
            index
        ) {

            const wrap =
                document.createElement(
                    "div"
                );


            wrap.className =
                "week-bar-wrap";


            const value =
                document.createElement(
                    "div"
                );


            value.className =
                "week-value";


            value.textContent =
                item.total +
                "분";


            const bar =
                document.createElement(
                    "div"
                );


            bar.className =
                "week-bar";


            const height =
                item.total === 0
                    ? 4
                    : Math.max(
                        10,
                        (
                            item.total /
                            max
                        ) * 175
                    );


            bar.style.height =
                height +
                "px";


            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "week-label";


            label.textContent =
                (
                    index + 1
                ) +
                "주차";


            wrap.appendChild(
                value
            );


            wrap.appendChild(
                bar
            );


            wrap.appendChild(
                label
            );


            chart.appendChild(
                wrap
            );

        }
    );

}


// ==================================================
// 운동 유형 렌더링
// ==================================================

function renderExerciseTypes() {

    const container =
        document
            .getElementById(
                "exerciseTypeChart"
            );


    container.innerHTML = "";


    const data =
        getExerciseTypeData();


    if (
        data.length === 0
    ) {

        container.innerHTML =
            `
            <div class="no-data">
                아직 운동 기록이 없습니다.
            </div>
            `;

        return;

    }


    const total =
        records.length;


    data.forEach(
        function (
            [name, count]
        ) {

            const percent =
                (
                    count /
                    total
                ) * 100;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "type-row";


            const nameElement =
                document.createElement(
                    "div"
                );


            nameElement.className =
                "type-name";


            nameElement.textContent =
                getIcon(name) +
                " " +
                name;


            const progress =
                document.createElement(
                    "div"
                );


            progress.className =
                "type-progress";


            const inner =
                document.createElement(
                    "div"
                );


            inner.className =
                "type-progress-inner";


            inner.style.width =
                percent +
                "%";


            progress.appendChild(
                inner
            );


            const percentElement =
                document.createElement(
                    "div"
                );


            percentElement.className =
                "type-percent";


            percentElement.textContent =
                percent.toFixed(0) +
                "%";


            row.appendChild(
                nameElement
            );


            row.appendChild(
                progress
            );


            row.appendChild(
                percentElement
            );


            container.appendChild(
                row
            );

        }
    );

}


// ==================================================
// 최근 통계 기록
// ==================================================

function renderRecentStats() {

    const container =
        document
            .getElementById(
                "statsRecentRecords"
            );


    container.innerHTML = "";


    const recent =
        [...records]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            )
            .slice(
                0,
                7
            );


    document
        .getElementById(
            "statsRecentCount"
        )
        .textContent =
            recent.length +
            "개";


    if (
        recent.length === 0
    ) {

        container.innerHTML =
            `
            <div class="no-data">
                아직 운동 기록이 없습니다.
            </div>
            `;

        return;

    }


    recent.forEach(
        function (
            record
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "stats-table-row";


            const date =
                document.createElement(
                    "span"
                );


            date.textContent =
                formatDate(
                    record.date
                );


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                getIcon(
                    record.name
                ) +
                " " +
                record.name;


            const time =
                document.createElement(
                    "span"
                );


            time.textContent =
                record.time +
                "분";


            row.appendChild(
                date
            );


            row.appendChild(
                name
            );


            row.appendChild(
                time
            );


            container.appendChild(
                row
            );

        }
    );

}


// ==================================================
// 통계 기간 변경
// ==================================================

document
    .getElementById(
        "statsPeriod"
    )
    .addEventListener(
        "change",
        function () {

            renderWeeklyChart();

        }
    );


// ==================================================
// 저장 완료 Toast
// ==================================================

function showToast() {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        1800
    );

}


// ==================================================
// 시작
// ==================================================

async function start() {

    const savedUser =
        loadLogin();


    if (savedUser) {

        currentUser =
            savedUser;


        await openApp();

        return;

    }


    document
        .getElementById(
            "authPage"
        )
        .classList
        .remove(
            "hidden"
        );


    document
        .getElementById(
            "appPage"
        )
        .classList
        .add(
            "hidden"
        );


    document
        .getElementById(
            "statsPage"
        )
        .classList
        .add(
            "hidden"
        );

}


start();
