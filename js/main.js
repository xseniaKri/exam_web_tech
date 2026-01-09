const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'b634db2f-f767-4d3e-a0c0-341ca2959925';

const COURSES_API = API_BASE_URL + '/api/courses';
const TUTORS_API = API_BASE_URL + '/api/tutors';
const ORDERS_API = API_BASE_URL + '/api/orders';

const ITEMS_PER_PAGE = 5;
const CURRENT_STUDENT_ID = 1;

let allCourses = [];
let allTutors = [];
let allOrders = [];
let currentPage = 1;
let currentEditingOrderId = null;
let currentDeletingOrderId = null;
let selectedTutorId = null;
let currentCourseForApplication = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Language School website loaded');
    fetchCourses();
    fetchTutors();
    setupTutorSearchFilters();
});

async function fetchCourses() {
    try {
        const response = await fetch(COURSES_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch courses');
        allCourses = await response.json();
        renderCourses();
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

async function fetchTutors() {
    try {
        const response = await fetch(TUTORS_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch tutors');
        allTutors = await response.json();
        populateTutorsLanguageFilter();
        renderTutors();
    } catch (error) {
        console.error('Error fetching tutors:', error);
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(ORDERS_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch orders');
        allOrders = await response.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function setupTutorSearchFilters() {
    const languageFilter = document.getElementById('tutor-language');
    const levelFilter = document.getElementById('tutor-level');
    
    if (languageFilter) {
        languageFilter.addEventListener('change', renderTutors);
    }
    if (levelFilter) {
        levelFilter.addEventListener('change', renderTutors);
    }
}

function populateTutorsLanguageFilter() {
    const select = document.getElementById('tutor-language');
    const languages = new Set();
    
    allTutors.forEach(tutor => {
        if (tutor.languages_offered) {
            tutor.languages_offered.forEach(lang => languages.add(lang));
        }
    });
    
    const sortedLanguages = Array.from(languages).sort();
    select.innerHTML = '<option value="">Все языки</option>' +
        sortedLanguages.map(lang =>
            `<option value="${lang}">${lang}</option>`
        ).join('');
}

function renderCourses() {
    const container = document.getElementById('courses-container');
    const paginationContainer = document.getElementById('courses-pagination');

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentCourses = allCourses.slice(startIndex, endIndex);

    container.innerHTML = currentCourses.map(course => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm course-card">
                <div class="card-body">
                    <h3 class="card-title h5 fw-bold mb-3">${course.name}</h3>
                    <p class="card-text mb-2"><strong>Уровень:</strong> ${course.level}</p>
                    <p class="card-text mb-2"><strong>Преподаватель:</strong> ${course.teacher}</p>
                    <p class="card-text mb-3"><strong>Длительность:</strong> ${course.total_length} недель</p>
                    <button class="btn btn-primary course-btn" onclick="openCourseApplicationModal(${course.id})">Подать заявку</button>
                </div>
            </div>
        </div>
    `).join('');

    const totalPages = Math.ceil(allCourses.length / ITEMS_PER_PAGE);
    renderPagination(totalPages, paginationContainer);
}

function renderPagination(totalPages, container) {
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage - 1})">Предыдущая</button>
    </li>`;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}">
            <button class="page-link" onclick="changePage(${i})">${i}</button>
        </li>`;
    }

    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage + 1})">Следующая</button>
    </li>`;
    paginationHTML += '</ul></nav>';

    container.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(allCourses.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCourses();
}

function renderTutors() {
    const tbody = document.getElementById('tutors-table-body');
    const languageFilter = document.getElementById('tutor-language').value;
    const levelFilter = document.getElementById('tutor-level').value;
    
    let filteredTutors = allTutors;
    
    if (languageFilter) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.languages_offered && tutor.languages_offered.includes(languageFilter)
        );
    }
    
    if (levelFilter) {
        filteredTutors = filteredTutors.filter(tutor => 
            tutor.language_level && tutor.language_level.toLowerCase() === levelFilter.toLowerCase()
        );
    }
    
    if (filteredTutors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted mb-0">Репетиторы не найдены</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredTutors.map(tutor => `
        <tr data-tutor-id="${tutor.id}" class="${selectedTutorId === tutor.id ? 'selected' : ''}" onclick="selectTutor(${tutor.id})">
            <td>
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6f42c1&color=fff&size=100" 
                     alt="${tutor.name}" class="tutor-photo">
            </td>
            <td class="fw-medium">${tutor.name}</td>
            <td>${tutor.language_level || '-'}</td>
            <td>${tutor.languages_spoken ? tutor.languages_spoken.join(', ') : '-'}</td>
            <td>${tutor.work_experience || 0}</td>
            <td>${tutor.price_per_hour || 0} ₽</td>
            <td>
                <button class="btn btn-sm btn-primary btn-select" onclick="event.stopPropagation(); selectTutorAndApply(${tutor.id})">
                    Выбрать
                </button>
            </td>
        </tr>
    `).join('');
}

function selectTutor(tutorId) {
    selectedTutorId = tutorId;
    renderTutors();
}

function selectTutorAndApply(tutorId) {
    const tutor = allTutors.find(t => t.id === tutorId);
    if (!tutor) return;
    
    selectedTutorId = tutorId;
    renderTutors();
    
    document.getElementById('orderModalTitle').textContent = 'Оформление заявки на репетитора';
    document.getElementById('order-form').reset();
    document.getElementById('order-id').value = '';
    
    const tutorSelect = document.getElementById('tutor_id');
    tutorSelect.innerHTML = `<option value="${tutor.id}" selected>${tutor.name} (${tutor.language_level})</option>`;
    tutorSelect.disabled = true;
    
    const courseSelect = document.getElementById('course_id');
    courseSelect.innerHTML = '<option value="">Курс не выбран</option>';
    courseSelect.disabled = true;
    
    document.getElementById('duration').value = '';
    document.getElementById('price').value = '0';
    
    document.querySelectorAll('#order-form input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    document.getElementById('order-submit-btn').textContent = 'Отправить';
    document.getElementById('order-submit-btn').onclick = submitTutorApplication;
    
    document.getElementById('date_start').parentElement.style.display = 'block';
    document.getElementById('time_start').parentElement.style.display = 'block';
    document.getElementById('duration').parentElement.style.display = 'block';
    document.getElementById('price').parentElement.style.display = 'block';
    
    const optionsSection = document.querySelector('.modal-body form .mb-3:last-of-type');
    if (optionsSection) {
        optionsSection.style.display = 'block';
    }
    
    document.getElementById('order-submit-btn').onclick = submitTutorApplication;
    
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
    
    setupTutorCostCalculation(tutor);
}

function openCourseApplicationModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    currentCourseForApplication = course;
    
    document.getElementById('application-course-id').value = course.id;
    document.getElementById('application-course-name').value = course.name;
    document.getElementById('application-teacher').value = course.teacher;
    document.getElementById('application-duration').textContent = course.total_length + ' недель';
    document.getElementById('application-week-length').textContent = course.week_length + ' часов';
    
    document.getElementById('application-date-start').innerHTML = '<option value="">Выберите дату</option>';
    document.getElementById('application-time-start').innerHTML = '<option value="">Сначала выберите дату</option>';
    document.getElementById('application-time-start').disabled = true;
    document.getElementById('application-students').value = 1;
    
    document.querySelectorAll('#course-application-form input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    document.getElementById('applied-options').innerHTML = '';
    
    if (course.start_dates && course.start_dates.length > 0) {
        const dateSelect = document.getElementById('application-date-start');
        const uniqueDates = [...new Set(course.start_dates.map(d => d.split('T')[0]))];
        dateSelect.innerHTML = '<option value="">Выберите дату</option>' +
            uniqueDates.map(date => `<option value="${date}">${formatDate(date)}</option>`).join('');
    }
    
    calculateTotalCost();
    
    const modal = new bootstrap.Modal(document.getElementById('courseApplicationModal'));
    modal.show();
}

document.getElementById('application-date-start').addEventListener('change', function() {
    const course = currentCourseForApplication;
    const selectedDate = this.value;
    
    const timeSelect = document.getElementById('application-time-start');
    
    if (!selectedDate || !course || !course.start_dates) {
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        timeSelect.disabled = true;
        calculateTotalCost();
        return;
    }
    
    const timeSlots = course.start_dates
        .filter(d => d.startsWith(selectedDate))
        .sort();
    
    timeSelect.innerHTML = '<option value="">Выберите время</option>' +
        timeSlots.map(slot => {
            const time = slot.split('T')[1].substring(0, 5);
            const endHour = parseInt(time.split(':')[0]) + course.week_length;
            const endTime = `${String(endHour).padStart(2, '0')}:${time.split(':')[1]}`;
            return `<option value="${time}" data-end="${endTime}">${time} - ${endTime}</option>`;
        }).join('');
    
    timeSelect.disabled = false;
    calculateTotalCost();
});

document.getElementById('application-time-start').addEventListener('change', calculateTotalCost);
document.getElementById('application-students').addEventListener('input', calculateTotalCost);

function calculateTotalCost() {
    const course = currentCourseForApplication;
    if (!course) return;
    
    const studentsCount = parseInt(document.getElementById('application-students').value) || 1;
    const selectedTimeOption = document.getElementById('application-time-start').selectedOptions[0];
    const selectedTime = document.getElementById('application-time-start').value;
    
    let baseCost = 0;
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    let weekendMultiplier = 1;
    
    const courseFeePerHour = course.course_fee_per_hour || 200;
    const durationInHours = course.total_length * course.week_length;
    const weekLength = course.week_length;
    
    baseCost = courseFeePerHour * durationInHours;
    
    if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400 * studentsCount;
        }
        if (hour >= 18 && hour < 20) {
            eveningSurcharge = 1000 * studentsCount;
        }
    }
    
    const selectedDate = document.getElementById('application-date-start').value;
    if (selectedDate) {
        const dayOfWeek = new Date(selectedDate).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendMultiplier = 1.5;
        }
    }
    
    let totalBeforeDiscounts = (baseCost * weekendMultiplier + morningSurcharge + eveningSurcharge) * studentsCount;
    
    let discounts = 0;
    let additions = 0;
    
    const earlyRegistration = document.getElementById('opt-early-registration').checked;
    const groupEnrollment = document.getElementById('opt-group-enrollment').checked;
    const intensiveCourse = document.getElementById('opt-intensive-course').checked;
    const supplementary = document.getElementById('opt-supplementary').checked;
    const personalized = document.getElementById('opt-personalized').checked;
    const excursions = document.getElementById('opt-excursions').checked;
    const assessment = document.getElementById('opt-assessment').checked;
    const interactive = document.getElementById('opt-interactive').checked;
    
    if (earlyRegistration) {
        discounts += totalBeforeDiscounts * 0.1;
    }
    if (groupEnrollment && studentsCount >= 5) {
        discounts += totalBeforeDiscounts * 0.15;
    }
    if (intensiveCourse && weekLength >= 5) {
        additions += totalBeforeDiscounts * 0.2;
    }
    if (supplementary) {
        additions += 2000 * studentsCount;
    }
    if (personalized) {
        additions += 1500 * course.total_length;
    }
    if (excursions) {
        additions += totalBeforeDiscounts * 0.25;
    }
    if (assessment) {
        additions += 300 * studentsCount;
    }
    if (interactive) {
        additions += totalBeforeDiscounts * 0.5;
    }
    
    const endDate = document.getElementById('application-date-start').value;
    if (endDate && course.total_length) {
        const startDate = new Date(endDate);
        const endDateCalc = new Date(startDate);
        endDateCalc.setDate(endDateCalc.getDate() + (course.total_length * 7));
        document.getElementById('application-end-date').textContent = formatDate(endDateCalc.toISOString().split('T')[0]);
    }
    
    const finalTotal = totalBeforeDiscounts + additions - discounts;
    
    document.getElementById('application-total-cost').textContent = formatCurrency(finalTotal);
    
    updateAppliedOptionsBadges({
        earlyRegistration,
        groupEnrollment: groupEnrollment && studentsCount >= 5,
        intensiveCourse: intensiveCourse && weekLength >= 5,
        supplementary,
        personalized,
        excursions,
        assessment,
        interactive
    });
}

function updateAppliedOptionsBadges(options) {
    const container = document.getElementById('applied-options');
    const badges = [];
    
    if (options.earlyRegistration) {
        badges.push('<span class="option-badge option-badge-discount">Ранняя регистрация -10%</span>');
    }
    if (options.groupEnrollment) {
        badges.push('<span class="option-badge option-badge-discount">Групповая запись -15%</span>');
    }
    if (options.intensiveCourse) {
        badges.push('<span class="option-badge option-badge-additional">Интенсивный курс +20%</span>');
    }
    if (options.supplementary) {
        badges.push('<span class="option-badge option-badge-additional">Доп. материалы +2000₽</span>');
    }
    if (options.personalized) {
        badges.push('<span class="option-badge option-badge-additional">Индивидуальные +1500₽/нед</span>');
    }
    if (options.excursions) {
        badges.push('<span class="option-badge option-badge-additional">Экскурсии +25%</span>');
    }
    if (options.assessment) {
        badges.push('<span class="option-badge option-badge-additional">Оценка +300₽</span>');
    }
    if (options.interactive) {
        badges.push('<span class="option-badge option-badge-additional">Платформа +50%</span>');
    }
    
    container.innerHTML = badges.length > 0 ? '<div class="mb-2">Применённые опции:</div>' + badges.join(' ') : '';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
}

async function submitCourseApplication() {
    const course = currentCourseForApplication;
    if (!course) return;
    
    const dateStart = document.getElementById('application-date-start').value;
    const timeStart = document.getElementById('application-time-start').value;
    const studentsCount = parseInt(document.getElementById('application-students').value) || 1;
    
    if (!dateStart) {
        showAlert('danger', 'Выберите дату начала курса');
        return;
    }
    if (!timeStart) {
        showAlert('danger', 'Выберите время занятия');
        return;
    }
    
    const costText = document.getElementById('application-total-cost').textContent;
    const price = parseInt(costText.replace(/\D/g, ''));
    
    const formData = {
        course_id: course.id,
        tutor_id: null,
        date_start: dateStart,
        time_start: timeStart,
        duration: course.total_length * course.week_length,
        persons: studentsCount,
        price: price,
        early_registration: document.getElementById('opt-early-registration').checked,
        group_enrollment: document.getElementById('opt-group-enrollment').checked && studentsCount >= 5,
        intensive_course: document.getElementById('opt-intensive-course').checked && course.week_length >= 5,
        supplementary: document.getElementById('opt-supplementary').checked,
        personalized: document.getElementById('opt-personalized').checked,
        excursions: document.getElementById('opt-excursions').checked,
        assessment: document.getElementById('opt-assessment').checked,
        interactive: document.getElementById('opt-interactive').checked
    };
    
    try {
        const response = await fetch(ORDERS_API + '?api_key=' + API_KEY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при отправке заявки');
        }
        
        showAlert('success', 'Заявка успешно отправлена!');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('courseApplicationModal'));
        modal.hide();
        
        fetchOrders();
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showAlert('danger', error.message || 'Ошибка при отправке заявки');
    }
}

function showAlert(type, message) {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type + ' alert-dismissible fade show';
    alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    container.appendChild(alert);
    setTimeout(function() {
        alert.classList.remove('show');
        setTimeout(function() {
            alert.remove();
        }, 150);
    }, 5000);
}

function populateTutorsSelect() {
    const select = document.getElementById('tutor_id');
    select.innerHTML = '<option value="">Выберите репетитора</option>' +
        allTutors.map(tutor =>
            `<option value="${tutor.id}">${tutor.name} (${tutor.language_level})</option>`
        ).join('');
}

function populateCoursesSelect() {
    const select = document.getElementById('course_id');
    select.innerHTML = '<option value="">Выберите курс</option>' +
        allCourses.map(course =>
            `<option value="${course.id}">${course.name}</option>`
        ).join('');
}

function openOrderModal() {
    currentEditingOrderId = null;
    document.getElementById('orderModalTitle').textContent = 'Оформление заявки';
    document.getElementById('order-submit-btn').textContent = 'Отправить';
    document.getElementById('order-form').reset();
    document.getElementById('order-id').value = '';
    populateCoursesSelect();
    populateTutorsSelect();
}

function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    currentEditingOrderId = orderId;
    document.getElementById('orderModalTitle').textContent = 'Редактирование заявки';
    document.getElementById('order-submit-btn').textContent = 'Сохранить';
    document.getElementById('order-id').value = orderId;
    document.getElementById('tutor_id').value = order.tutor_id || '';
    document.getElementById('course_id').value = order.course_id || '';
    document.getElementById('date_start').value = order.date_start;
    document.getElementById('time_start').value = order.time_start;
    document.getElementById('duration').value = order.duration || '';
    document.getElementById('persons').value = order.persons;
    document.getElementById('price').value = order.price;
    document.getElementById('early_registration').checked = order.early_registration;
    document.getElementById('group_enrollment').checked = order.group_enrollment;
    document.getElementById('intensive_course').checked = order.intensive_course;
    document.getElementById('supplementary').checked = order.supplementary;
    document.getElementById('personalized').checked = order.personalized;
    document.getElementById('excursions').checked = order.excursions;
    document.getElementById('assessment').checked = order.assessment;
    document.getElementById('interactive').checked = order.interactive;

    populateCoursesSelect();
    populateTutorsSelect();
    document.getElementById('tutor_id').value = order.tutor_id || '';
    document.getElementById('course_id').value = order.course_id || '';

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

function getOrderFormData() {
    return {
        tutor_id: document.getElementById('tutor_id').value ? parseInt(document.getElementById('tutor_id').value) : null,
        course_id: document.getElementById('course_id').value ? parseInt(document.getElementById('course_id').value) : null,
        date_start: document.getElementById('date_start').value,
        time_start: document.getElementById('time_start').value,
        duration: document.getElementById('duration').value ? parseInt(document.getElementById('duration').value) : null,
        persons: parseInt(document.getElementById('persons').value),
        price: parseInt(document.getElementById('price').value),
        early_registration: document.getElementById('early_registration').checked,
        group_enrollment: document.getElementById('group_enrollment').checked,
        intensive_course: document.getElementById('intensive_course').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };
}

async function submitOrder() {
    const formData = getOrderFormData();

    if (!formData.course_id && !formData.tutor_id) {
        showAlert('danger', 'Выберите курс или репетитора');
        return;
    }

    if (!formData.date_start || !formData.time_start) {
        showAlert('danger', 'Заполните дату и время');
        return;
    }

    try {
        const url = currentEditingOrderId
            ? `${ORDERS_API}/${currentEditingOrderId}?api_key=${API_KEY}`
            : `${ORDERS_API}?api_key=${API_KEY}`;

        const method = currentEditingOrderId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при сохранении заявки');
        }

        const result = await response.json();

        showAlert('success', currentEditingOrderId
            ? 'Заявка успешно обновлена'
            : 'Заявка успешно создана');

        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();

        document.getElementById('order-form').reset();

        if (currentEditingOrderId) {
            const index = allOrders.findIndex(o => o.id === currentEditingOrderId);
            if (index !== -1) {
                allOrders[index] = result;
            }
        } else {
            allOrders.push(result);
        }

    } catch (error) {
        console.error('Error submitting order:', error);
        showAlert('danger', error.message || 'Ошибка при сохранении заявки');
    }
}

async function submitTutorApplication() {
    const tutorId = document.getElementById('tutor_id').value;
    if (!tutorId) {
        showAlert('danger', 'Репетитор не выбран');
        return;
    }

    const tutor = allTutors.find(t => t.id === parseInt(tutorId));
    if (!tutor) return;

    const formData = {
        tutor_id: parseInt(tutorId),
        course_id: null,
        date_start: document.getElementById('date_start').value,
        time_start: document.getElementById('time_start').value,
        duration: parseInt(document.getElementById('duration').value) || tutor.work_experience || 1,
        persons: parseInt(document.getElementById('persons').value) || 1,
        price: parseInt(document.getElementById('price').value) || 0,
        early_registration: document.getElementById('early_registration').checked,
        group_enrollment: document.getElementById('group_enrollment').checked,
        intensive_course: document.getElementById('intensive_course').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };

    if (!formData.date_start) {
        showAlert('danger', 'Выберите дату начала');
        return;
    }
    if (!formData.time_start) {
        showAlert('danger', 'Выберите время занятия');
        return;
    }

    try {
        const response = await fetch(ORDERS_API + '?api_key=' + API_KEY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при отправке заявки');
        }

        showAlert('success', 'Заявка на репетитора успешно создана');

        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        resetOrderModalState();
        fetchOrders();

    } catch (error) {
        console.error('Error submitting tutor application:', error);
        showAlert('danger', error.message || 'Ошибка при отправке заявки');
    }
}

function setupTutorCostCalculation(tutor) {
    const dateInput = document.getElementById('date_start');
    const timeInput = document.getElementById('time_start');
    const durationInput = document.getElementById('duration');
    const personsInput = document.getElementById('persons');
    
    dateInput.value = '';
    timeInput.value = '';
    durationInput.value = tutor.work_experience || 1;
    personsInput.value = 1;
    
    dateInput.addEventListener('change', calculateTutorCost);
    timeInput.addEventListener('change', calculateTutorCost);
    durationInput.addEventListener('input', calculateTutorCost);
    personsInput.addEventListener('input', calculateTutorCost);
    
    document.querySelectorAll('#order-form input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', calculateTutorCost);
    });
    
    calculateTutorCost();
}

function calculateTutorCost() {
    const tutorSelect = document.getElementById('tutor_id');
    const tutorId = parseInt(tutorSelect.value);
    const tutor = allTutors.find(t => t.id === tutorId);
    
    if (!tutor) return;
    
    const studentsCount = parseInt(document.getElementById('persons').value) || 1;
    const duration = parseInt(document.getElementById('duration').value) || tutor.work_experience || 1;
    const selectedTime = document.getElementById('time_start').value;
    
    let baseCost = 0;
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    let weekendMultiplier = 1;
    
    const pricePerHour = tutor.price_per_hour || 500;
    baseCost = pricePerHour * duration * studentsCount;
    
    if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400 * studentsCount;
        }
        if (hour >= 18 && hour < 20) {
            eveningSurcharge = 1000 * studentsCount;
        }
    }
    
    const selectedDate = document.getElementById('date_start').value;
    if (selectedDate) {
        const dayOfWeek = new Date(selectedDate).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendMultiplier = 1.5;
        }
    }
    
    let totalBeforeDiscounts = (baseCost * weekendMultiplier + morningSurcharge + eveningSurcharge);
    
    let discounts = 0;
    let additions = 0;
    
    const earlyRegistration = document.getElementById('early_registration').checked;
    const groupEnrollment = document.getElementById('group_enrollment').checked;
    const intensiveCourse = document.getElementById('intensive_course').checked;
    const supplementary = document.getElementById('supplementary').checked;
    const personalized = document.getElementById('personalized').checked;
    const excursions = document.getElementById('excursions').checked;
    const assessment = document.getElementById('assessment').checked;
    const interactive = document.getElementById('interactive').checked;
    
    if (earlyRegistration) {
        discounts += totalBeforeDiscounts * 0.1;
    }
    if (groupEnrollment && studentsCount >= 5) {
        discounts += totalBeforeDiscounts * 0.15;
    }
    if (intensiveCourse) {
        additions += totalBeforeDiscounts * 0.2;
    }
    if (supplementary) {
        additions += 2000 * studentsCount;
    }
    if (personalized) {
        additions += 1500 * duration;
    }
    if (excursions) {
        additions += totalBeforeDiscounts * 0.25;
    }
    if (assessment) {
        additions += 300 * studentsCount;
    }
    if (interactive) {
        additions += totalBeforeDiscounts * 0.5;
    }
    
    const finalTotal = totalBeforeDiscounts + additions - discounts;
    
    document.getElementById('price').value = Math.round(finalTotal);
}

function resetOrderModalState() {
    document.getElementById('order-form').reset();
    document.getElementById('order-id').value = '';
    
    const tutorSelect = document.getElementById('tutor_id');
    tutorSelect.disabled = false;
    populateTutorsSelect();
    
    const courseSelect = document.getElementById('course_id');
    courseSelect.disabled = false;
    populateCoursesSelect();
    
    document.getElementById('date_start').parentElement.style.display = 'block';
    document.getElementById('time_start').parentElement.style.display = 'block';
    document.getElementById('duration').parentElement.style.display = 'block';
    document.getElementById('price').parentElement.style.display = 'block';
    
    const optionsSection = document.querySelector('.modal-body form .mb-3:last-of-type');
    if (optionsSection) {
        optionsSection.style.display = 'block';
    }
    
    document.getElementById('order-submit-btn').onclick = submitOrder;
}

function deleteOrder(orderId) {
    currentDeletingOrderId = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    if (!currentDeletingOrderId) return;

    try {
        const url = `${ORDERS_API}/${currentDeletingOrderId}?api_key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при удалении заявки');
        }

        showAlert('success', 'Заявка успешно удалена');

        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();

        allOrders = allOrders.filter(o => o.id !== currentDeletingOrderId);

    } catch (error) {
        console.error('Error deleting order:', error);
        showAlert('danger', error.message || 'Ошибка при удалении заявки');
    }
}

