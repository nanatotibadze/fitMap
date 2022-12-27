'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputElevationDiv = inputElevation.closest('.form__row');
const inputCadenceDiv = inputCadence.closest('.form__row');
const inputDistanceDiv = inputDistance.closest('.form__row');
const h2 = document.querySelector('.instruction');

let map, mapEvent;
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration) {
    this.coords = coords;
    this.duration = duration;
    this.setDescription();
  }

  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, duration, cadence, distance) {
    super(coords, duration);
    this.cadence = cadence;
    this.distance = distance;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Hiking extends Workout {
  type = 'hiking';

  constructor(coords, duration, cadence, distance) {
    super(coords, duration);
    this.cadence = cadence;
    this.distance = distance;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, elevation, distance) {
    super(coords, duration);
    this.elevation = elevation;
    this.distance = distance;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Yoga extends Workout {
  type = 'yoga';
  constructor(coords, duration) {
    super(coords, duration);
    this.setDescription();
  }
}

class App {
  map;
  mapEvent;
  workouts = [];
  mapZoom = 13;

  constructor() {
    this.getPosition();
    this.getLocalStorage();
    form.addEventListener('submit', this.newWorkout.bind(this));
    inputType.addEventListener('change', this.changeFields.bind(this));
    containerWorkouts.addEventListener('click', this.moveToPup.bind(this));
  }

  getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.loadMap.bind(this),
        function () {
          alert("Couldn't get your position");
        }
      );
  }
  loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.map = L.map('map').setView(coords, this.mapZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.map.on('click', this.showForm.bind(this));
    this.workouts.forEach(work => this.renderWorkoutMarker(work));
  }

  showForm(mapE) {
    this.mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  hideForm() {
    //prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  moveToPup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.map.setView(workout.coords, this.mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  newWorkout(e) {
    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.mapEvent.latlng;
    let workout;

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // if (!validInputs(duration) || !allPositive(duration))
    //   return alert('EROR 1');

    if (type === 'running' || type === 'hiking') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(cadence, distance, duration) ||
        !allPositive(distance, cadence, duration)
      ) {
        return alert('Enter valid number');
      }

      if (type === 'running')
        workout = new Running([lat, lng], duration, cadence, distance);

      if (type === 'hiking')
        workout = new Hiking([lat, lng], duration, cadence, distance);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(elevation, distance, duration) ||
        !allPositive(distance, duration)
      ) {
        return alert('Enter valid number');
      }
      workout = new Cycling([lat, lng], duration, elevation, distance);
    }

    if (type === 'yoga') {
      if (!validInputs(duration) || !allPositive(duration)) {
        return alert('Enter valid number');
      }
      workout = new Yoga([lat, lng], duration);
    }

    this.workouts.push(workout);
    this.renderWorkoutMarker(workout);
    this.renderWorkout(workout);
    this.hideForm();
    this.setLocalStorage();
  }

  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
    console.log(JSON.stringify(this.workouts));
  }

  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.workouts = data;
    this.workouts.forEach(work => this.renderWorkout(work));
  }

  renderWorkoutMarker(workout) {
    //prettier-ignore
    L.marker(workout.coords).addTo(this.map).bindPopup(L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${this.icon(workout.type)} ${workout.description}`)
      .openPopup();
  }

  icon(type) {
    if (type === 'running') return '🏃‍♂️';
    if (type === 'cycling') return '🚴‍♀️';
    if (type === 'yoga') return '🧘';
    if (type === 'hiking') return '🥾';
  }

  renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${this.icon(workout.type)}</span>
            <span class="workout__value">${
              workout.type === 'yoga' ? ' ' : workout.distance
            }</span>
      <span class="workout__unit">${
        workout.type === 'yoga' ? ' ' : 'km'
      }</span></span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'hiking' || workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🦶🏼' : '🏔️'
        }</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li> `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  changeFields() {
    const value = inputType.options[inputType.selectedIndex].value;
    const addClass = (...inputs) =>
      inputs.forEach(inp => inp.classList.add('form__row--hidden'));

    const removeClass = (...inputs) =>
      inputs.forEach(inp => inp.classList.remove('form__row--hidden'));
    if (value == 'cycling') {
      removeClass(inputElevationDiv, inputDistanceDiv);
      addClass(inputCadenceDiv);
    }

    if (value == 'running' || value == 'hiking') {
      addClass(inputElevationDiv);
      removeClass(inputDistanceDiv, inputCadenceDiv);
    }

    if (value == 'yoga') {
      addClass(inputDistanceDiv, inputElevationDiv, inputCadenceDiv);
    }
  }
}

const app = new App();
app;
