class TaskManager {
            constructor() {
                this.projects = this.loadProjects(); // Cargar proyectos al iniciar
                this.currentProjectId = null;
                this.init();
            }

            init() {
                this.bindEvents();
                this.renderProjects(); // Renderizar proyectos al iniciar
                this.updateStats();
            }

            bindEvents() {
                document.getElementById('projectForm').addEventListener('submit', (e) => this.createProject(e));
                document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
                document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
                document.getElementById('taskName').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTask();
                });

                // Filtros
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => this.filterProjects(e));
                });

                // Cerrar modal al hacer clic fuera
                window.addEventListener('click', (e) => {
                    if (e.target === document.getElementById('taskModal')) {
                        this.closeModal();
                    }
                });
            }

            createProject(e) {
                e.preventDefault();
                const form = e.target;
                
                const project = {
                    id: Date.now(),
                    name: document.getElementById('projectName').value,
                    description: document.getElementById('projectDescription').value,
                    priority: document.getElementById('projectPriority').value,
                    deadline: document.getElementById('projectDeadline').value,
                    tasks: [],
                    createdAt: new Date().toLocaleDateString()
                };

                this.projects.push(project);
                this.saveProjects(); // Guardar proyectos
                this.renderProjects();
                this.updateStats();
                form.reset();
                this.showNotification('Proyecto creado exitosamente! 🎉');
            }

            renderProjects() {
                const grid = document.getElementById('projectsGrid');
                grid.innerHTML = '';

                // Obtener el filtro activo
                const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;

                this.projects.forEach(project => {
                    // Aplicar filtro
                    if (activeFilter !== 'all' && project.priority !== activeFilter) {
                        return; // Saltar si no coincide con el filtro
                    }

                    const completedTasks = project.tasks.filter(task => task.completed).length;
                    const totalTasks = project.tasks.length;
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                    const priorityClass = `priority-${project.priority}`;
                    const priorityText = project.priority.toUpperCase();
                    let priorityIcon = '';

                    switch(project.priority) {
                        case 'high': priorityIcon = '<i class="fas fa-exclamation-triangle"></i>'; break;
                        case 'medium': priorityIcon = '<i class="fas fa-sliders-h"></i>'; break;
                        case 'low': priorityIcon = '<i class="fas fa-check-circle"></i>'; break;
                    }

                    const projectCard = document.createElement('div');
                    projectCard.className = 'project-card';
                    projectCard.innerHTML = `
                        <div class="project-header">
                            <div>
                                <div class="project-title">${project.name}</div>
                                <div class="project-description">${project.description}</div>
                            </div>
                            <span class="priority-badge ${priorityClass}">
                                ${priorityIcon} ${priorityText}
                            </span>
                        </div>
                        <div class="project-meta">
                            <span><i class="far fa-calendar-alt"></i> ${project.deadline || 'Sin fecha'}</span>
                            <span class="task-count"><i class="fas fa-tasks"></i> ${totalTasks} tareas</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="project-actions">
                            <button class="btn btn-primary" onclick="taskManager.openTaskModal(${project.id})">
                                <i class="fas fa-clipboard-list"></i> Tareas
                            </button>
                            <button class="btn btn-danger" onclick="taskManager.deleteProject(${project.id})">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    `;
                    grid.appendChild(projectCard);
                });
            }

            openTaskModal(projectId) {
                this.currentProjectId = projectId;
                const project = this.projects.find(p => p.id === projectId);
                document.getElementById('modalTitle').textContent = `Tareas: ${project.name}`;
                this.renderTasks();
                document.getElementById('taskModal').style.display = 'flex'; // Usar flex para centrar
            }

            closeModal() {
                document.getElementById('taskModal').style.display = 'none';
                document.getElementById('taskName').value = '';
                this.currentProjectId = null;
                this.renderProjects(); // Volver a renderizar proyectos para actualizar progreso si se modificaron tareas
            }

            addTask() {
                const taskName = document.getElementById('taskName').value.trim();
                if (!taskName || !this.currentProjectId) {
                    this.showNotification('El nombre de la tarea no puede estar vacío.', 'error');
                    return;
                }

                const project = this.projects.find(p => p.id === this.currentProjectId);
                const task = {
                    id: Date.now(),
                    name: taskName,
                    completed: false,
                    createdAt: new Date().toLocaleDateString()
                };

                project.tasks.push(task);
                this.saveProjects(); // Guardar proyectos
                document.getElementById('taskName').value = '';
                this.renderTasks();
                this.updateStats();
                this.showNotification('Tarea agregada! ✅');
            }

            renderTasks() {
                const project = this.projects.find(p => p.id === this.currentProjectId);
                const taskList = document.getElementById('taskList');
                taskList.innerHTML = '';

                if (project && project.tasks.length > 0) {
                    project.tasks.forEach(task => {
                        const taskItem = document.createElement('div');
                        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                        taskItem.innerHTML = `
                            <div>
                                <strong>${task.name}</strong>
                                <br>
                                <small><i class="far fa-clock"></i> ${task.createdAt}</small>
                            </div>
                            <div class="task-actions">
                                <button class="btn btn-secondary" onclick="taskManager.toggleTask(${task.id})">
                                    ${task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>'}
                                </button>
                                <button class="btn btn-danger" onclick="taskManager.deleteTask(${task.id})">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        `;
                        taskList.appendChild(taskItem);
                    });
                } else {
                    taskList.innerHTML = '<p style="text-align: center; color: #888;">No hay tareas para este proyecto. ¡Agrega una!</p>';
                }
            }

            toggleTask(taskId) {
                const project = this.projects.find(p => p.id === this.currentProjectId);
                const task = project.tasks.find(t => t.id === taskId);
                task.completed = !task.completed;
                this.saveProjects(); // Guardar proyectos
                this.renderTasks();
                this.renderProjects(); // Actualizar el progreso en la tarjeta del proyecto
                this.updateStats();
                this.showNotification(task.completed ? 'Tarea completada! 🎉' : 'Tarea reactivada! 🔄');
            }

            deleteTask(taskId) {
                if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
                
                const project = this.projects.find(p => p.id === this.currentProjectId);
                project.tasks = project.tasks.filter(t => t.id !== taskId);
                this.saveProjects(); // Guardar proyectos
                this.renderTasks();
                this.renderProjects(); // Actualizar el conteo de tareas y progreso
                this.updateStats();
                this.showNotification('Tarea eliminada! 🗑️');
            }

            deleteProject(projectId) {
                if (!confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán todas sus tareas.')) return;
                
                this.projects = this.projects.filter(p => p.id !== projectId);
                this.saveProjects(); // Guardar proyectos
                this.renderProjects();
                this.updateStats();
                this.showNotification('Proyecto eliminado! 🗑️');
            }

            filterProjects(e) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Volver a renderizar los proyectos para aplicar el filtro
                this.renderProjects();
            }

            updateStats() {
                const totalProjects = this.projects.length;
                const totalTasks = this.projects.reduce((sum, project) => sum + project.tasks.length, 0);
                const completedTasks = this.projects.reduce((sum, project) => 
                    sum + project.tasks.filter(task => task.completed).length, 0);
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                document.getElementById('totalProjects').textContent = totalProjects;
                document.getElementById('totalTasks').textContent = totalTasks;
                document.getElementById('completedTasks').textContent = completedTasks;
                document.getElementById('progressPercentage').textContent = `${progress}%`;
            }

            // Gestión de almacenamiento local
            saveProjects() {
                localStorage.setItem('projects', JSON.stringify(this.projects));
            }

            loadProjects() {
                const projects = localStorage.getItem('projects');
                return projects ? JSON.parse(projects) : [];
            }

            showNotification(message, type = 'success') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${message}`;
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-in forwards';
                    notification.addEventListener('animationend', () => notification.remove());
                }, 3000);
            }
        }

        // Inicializar la aplicación
        const taskManager = new TaskManager();

        // Agregar estilos de animación para la notificación de salida
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);