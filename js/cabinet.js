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

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cabinet page loaded');
    fetchCourses();
    fetchTutors();
    fetchOrders();
});

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

