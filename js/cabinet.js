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
let currentCourseForApplication = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cabinet page loaded');
    fetchCourses();
    fetchTutors();
    fetchOrders();
    
    setupCourseModalListeners();
});

function setupCourseModalListeners() {
    const dateSelect = document.getElementById('application-date-start');
    if (dateSelect) {
        dateSelect.addEventListener('change', function() {
            const course = window.currentCourseForApplication;
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
    }
    
    const timeSelect = document.getElementById('application-time-start');
    if (timeSelect) {
        timeSelect.addEventListener('change', calculateTotalCost);
    }
    
    const studentsInput = document.getElementById('application-students');
    if (studentsInput) {
        studentsInput.addEventListener('input', calculateTotalCost);
    }
}

async function fetchCourses() {
    try {
        const response = await fetch(COURSES_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch courses');
        allCourses = await response.json();
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

async function fetchTutors() {
    try {
        const response = await fetch(TUTORS_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch tutors');
        allTutors = await response.json();
    } catch (error) {
        console.error('Error fetching tutors:', error);
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(ORDERS_API + '?api_key=' + API_KEY);
        if (!response.ok) throw new Error('Failed to fetch orders');
        allOrders = await response.json();
        renderOrders();
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function populateTutorsSelect() {
    const select = document.getElementById('tutor_id');
    if (!select) return;
    select.innerHTML = '<option value="">Выберите репетитора</option>' +
        allTutors.map(tutor =>
            `<option value="${tutor.id}">${tutor.name} (${tutor.language_level})</option>`
        ).join('');
}

function populateCoursesSelect() {
    const select = document.getElementById('course_id');
    if (!select) return;
    select.innerHTML = '<option value="">Выберите курс</option>' +
        allCourses.map(course =>
            `<option value="${course.id}">${course.name}</option>`
        ).join('');
}

function showAlert(type, message) {
    const container = document.getElementById('alert-container');
    if (!container) return;
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

function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const table = document.querySelector('.orders-table');

    if (allOrders.length === 0) {
        table.classList.add('d-none');
        noOrdersMessage.classList.remove('d-none');
        return;
    }

    table.classList.remove('d-none');
    noOrdersMessage.classList.add('d-none');

    tbody.innerHTML = allOrders.map(order => {
        const tutor = allTutors.find(t => t.id === order.tutor_id);
        const course = allCourses.find(c => c.id === order.course_id);
        const typeLabel = tutor ? `Репетитор: ${tutor.name}` : (course ? `Курс: ${course.name}` : '-');

        const options = [];
        if (order.early_registration) options.push('РР');
        if (order.group_enrollment) options.push('ГО');
        if (order.intensive_course) options.push('ИК');
        if (order.supplementary) options.push('ДМ');
        if (order.personalized) options.push('ПП');
        if (order.excursions) options.push('Э');
        if (order.assessment) options.push('ОЗ');
        if (order.interactive) options.push('ИМ');

        return `
            <tr>
                <td>${order.id}</td>
                <td>${typeLabel}</td>
                <td>${order.date_start}</td>
                <td>${order.time_start}</td>
                <td>${order.duration} ч.</td>
                <td>${order.price} ₽</td>
                <td>${options.length > 0 ? options.join(', ') : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editOrder(${order.id})">Ред.</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
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

    const tutor = allTutors.find(t => t.id === order.tutor_id);
    const course = allCourses.find(c => c.id === order.course_id);

    if (tutor && !course) {
        editTutorOrder(order, tutor);
    } else if (course) {
        editCourseOrder(order, course);
    } else {
        editGenericOrder(order);
    }
}

function editTutorOrder(order, tutor) {
    currentEditingOrderId = order.id;
    document.getElementById('orderModalTitle').textContent = 'Редактирование заявки на репетитора';
    
    const tutorSelect = document.getElementById('tutor_id');
    tutorSelect.innerHTML = `<option value="${tutor.id}" selected>${tutor.name} (${tutor.language_level})</option>`;
    tutorSelect.disabled = true;
    
    const courseSelect = document.getElementById('course_id');
    courseSelect.innerHTML = '<option value="">Курс не выбран</option>';
    courseSelect.disabled = true;
    
    document.getElementById('order-id').value = order.id;
    document.getElementById('date_start').value = order.date_start || '';
    document.getElementById('time_start').value = order.time_start || '';
    document.getElementById('duration').value = order.duration || tutor.work_experience || 1;
    document.getElementById('persons').value = order.persons || 1;
    document.getElementById('price').value = order.price || 0;
    document.getElementById('early_registration').checked = order.early_registration;
    document.getElementById('group_enrollment').checked = order.group_enrollment;
    document.getElementById('intensive_course').checked = order.intensive_course;
    document.getElementById('supplementary').checked = order.supplementary;
    document.getElementById('personalized').checked = order.personalized;
    document.getElementById('excursions').checked = order.excursions;
    document.getElementById('assessment').checked = order.assessment;
    document.getElementById('interactive').checked = order.interactive;
    
    document.getElementById('date_start').parentElement.style.display = 'block';
    document.getElementById('time_start').parentElement.style.display = 'block';
    document.getElementById('duration').parentElement.style.display = 'block';
    document.getElementById('price').parentElement.style.display = 'block';
    
    const optionsSection = document.querySelector('.modal-body form .mb-3:last-of-type');
    if (optionsSection) {
        optionsSection.style.display = 'block';
    }
    
    document.getElementById('order-submit-btn').textContent = 'Сохранить';
    document.getElementById('order-submit-btn').onclick = submitTutorOrderEdit;

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
    
    setupTutorCostCalculationForEdit(tutor);
}

async function submitTutorOrderEdit() {
    const formData = getOrderFormData();

    try {
        const url = `${ORDERS_API}/${currentEditingOrderId}?api_key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'PUT',
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
        showAlert('success', 'Заявка успешно обновлена');

        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        resetOrderModalState();
        
        const index = allOrders.findIndex(o => o.id === currentEditingOrderId);
        if (index !== -1) {
            allOrders[index] = result;
        }
        renderOrders();

    } catch (error) {
        console.error('Error updating order:', error);
        showAlert('danger', error.message || 'Ошибка при сохранении заявки');
    }
}

function editCourseOrder(order, course) {
    currentCourseForApplication = course;
    window.currentCourseForApplication = course;
    
    document.getElementById('application-course-id').value = course.id;
    document.getElementById('application-course-name').value = course.name;
    document.getElementById('application-teacher').value = course.teacher;
    document.getElementById('application-duration').textContent = course.total_length + ' недель';
    document.getElementById('application-week-length').textContent = course.week_length + ' часов';
    
    document.getElementById('application-date-start').innerHTML = '<option value="">Выберите дату</option>';
    document.getElementById('application-time-start').innerHTML = '<option value="">Выберите время</option>';
    document.getElementById('application-time-start').disabled = true;
    
    if (course.start_dates && course.start_dates.length > 0) {
        const dateSelect = document.getElementById('application-date-start');
        const uniqueDates = [...new Set(course.start_dates.map(d => d.split('T')[0]))];
        dateSelect.innerHTML = '<option value="">Выберите дату</option>' +
            uniqueDates.map(date => `<option value="${date}">${formatDate(date)}</option>`).join('');
        dateSelect.value = order.date_start || '';
        
        if (order.date_start && order.time_start) {
            const timeSlots = course.start_dates
                .filter(d => d.startsWith(order.date_start))
                .sort();
            const timeSelect = document.getElementById('application-time-start');
            timeSelect.disabled = false;
            timeSelect.innerHTML = '<option value="">Выберите время</option>' +
                timeSlots.map(slot => {
                    const time = slot.split('T')[1].substring(0, 5);
                    const endHour = parseInt(time.split(':')[0]) + course.week_length;
                    const endTime = `${String(endHour).padStart(2, '0')}:${time.split(':')[1]}`;
                    const selected = time === order.time_start ? 'selected' : '';
                    return `<option value="${time}" data-end="${endTime}" ${selected}>${time} - ${endTime}</option>`;
                }).join('');
        }
    }
    
    document.getElementById('application-students').value = order.persons || 1;
    
    document.getElementById('opt-early-registration').checked = order.early_registration;
    document.getElementById('opt-group-enrollment').checked = order.group_enrollment;
    document.getElementById('opt-intensive-course').checked = order.intensive_course;
    document.getElementById('opt-supplementary').checked = order.supplementary;
    document.getElementById('opt-personalized').checked = order.personalized;
    document.getElementById('opt-excursions').checked = order.excursions;
    document.getElementById('opt-assessment').checked = order.assessment;
    document.getElementById('opt-interactive').checked = order.interactive;
    
    if (order.date_start && course.total_length) {
        const startDate = new Date(order.date_start);
        const endDateCalc = new Date(startDate);
        endDateCalc.setDate(endDateCalc.getDate() + (course.total_length * 7));
        document.getElementById('application-end-date').textContent = formatDate(endDateCalc.toISOString().split('T')[0]);
    }
    
    calculateTotalCost();
    
    const submitBtn = document.querySelector('#courseApplicationModal .modal-footer button:last-child');
    submitBtn.textContent = 'Сохранить';
    submitBtn.onclick = submitCourseOrderEdit;

    const modal = new bootstrap.Modal(document.getElementById('courseApplicationModal'));
    modal.show();
}

async function submitCourseOrderEdit() {
    const course = currentCourseForApplication;
    if (!course) return;
    
    const formData = {
        course_id: course.id,
        tutor_id: null,
        date_start: document.getElementById('application-date-start').value,
        time_start: document.getElementById('application-time-start').value,
        duration: course.total_length * course.week_length,
        persons: parseInt(document.getElementById('application-students').value) || 1,
        price: parseInt(document.getElementById('application-total-cost').textContent.replace(/\D/g, '')),
        early_registration: document.getElementById('opt-early-registration').checked,
        group_enrollment: document.getElementById('opt-group-enrollment').checked,
        intensive_course: document.getElementById('opt-intensive-course').checked,
        supplementary: document.getElementById('opt-supplementary').checked,
        personalized: document.getElementById('opt-personalized').checked,
        excursions: document.getElementById('opt-excursions').checked,
        assessment: document.getElementById('opt-assessment').checked,
        interactive: document.getElementById('opt-interactive').checked
    };

    try {
        const url = `${ORDERS_API}/${currentEditingOrderId}?api_key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'PUT',
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
        showAlert('success', 'Заявка успешно обновлена');

        const modal = bootstrap.Modal.getInstance(document.getElementById('courseApplicationModal'));
        modal.hide();
        
        const index = allOrders.findIndex(o => o.id === currentEditingOrderId);
        if (index !== -1) {
            allOrders[index] = result;
        }
        renderOrders();

    } catch (error) {
        console.error('Error updating order:', error);
        showAlert('danger', error.message || 'Ошибка при сохранении заявки');
    }
}

function editGenericOrder(order) {
    currentEditingOrderId = order.id;
    document.getElementById('orderModalTitle').textContent = 'Редактирование заявки';
    document.getElementById('order-submit-btn').textContent = 'Сохранить';
    document.getElementById('order-id').value = order.id;
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

    document.getElementById('date_start').parentElement.style.display = 'block';
    document.getElementById('time_start').parentElement.style.display = 'block';
    document.getElementById('duration').parentElement.style.display = 'block';
    document.getElementById('price').parentElement.style.display = 'block';
    
    const optionsSection = document.querySelector('.modal-body form .mb-3:last-of-type');
    if (optionsSection) {
        optionsSection.style.display = 'block';
    }
    
    document.getElementById('tutor_id').disabled = false;
    document.getElementById('course_id').disabled = false;
    document.getElementById('order-submit-btn').onclick = submitGenericOrderEdit;

    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

async function submitGenericOrderEdit() {
    const formData = getOrderFormData();

    try {
        const url = `${ORDERS_API}/${currentEditingOrderId}?api_key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'PUT',
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
        showAlert('success', 'Заявка успешно обновлена');

        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        resetOrderModalState();
        
        const index = allOrders.findIndex(o => o.id === currentEditingOrderId);
        if (index !== -1) {
            allOrders[index] = result;
        }
        renderOrders();

    } catch (error) {
        console.error('Error updating order:', error);
        showAlert('danger', error.message || 'Ошибка при сохранении заявки');
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
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

function calculateTotalCost() {
    const course = window.currentCourseForApplication || currentCourseForApplication;
    if (!course) return;
    
    const studentsCount = parseInt(document.getElementById('application-students').value) || 1;
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
        const endDateEl = document.getElementById('application-end-date');
        if (endDateEl) {
            endDateEl.textContent = formatDate(endDateCalc.toISOString().split('T')[0]);
        }
    }
    
    const finalTotal = totalBeforeDiscounts + additions - discounts;
    
    const costEl = document.getElementById('application-total-cost');
    if (costEl) {
        costEl.textContent = formatCurrency(finalTotal);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
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
        renderOrders();

    } catch (error) {
        console.error('Error submitting order:', error);
        showAlert('danger', error.message || 'Ошибка при сохранении заявки');
    }
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
        renderOrders();

    } catch (error) {
        console.error('Error deleting order:', error);
        showAlert('danger', error.message || 'Ошибка при удалении заявки');
    }
}

async function submitCourseApplication() {
    const course = window.currentCourseForApplication;
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

