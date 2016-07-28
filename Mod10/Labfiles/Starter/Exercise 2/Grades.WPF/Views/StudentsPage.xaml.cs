﻿using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Documents;
using Grades.WPF.Services;
using System.Data.Services.Client;
using System.Windows.Threading;
using System.Threading.Tasks;
using Grades.WPF.GradesService.DataModel;

namespace Grades.WPF
{
    public partial class StudentsPage : UserControl
    {
        #region Constructor
        public StudentsPage()
        {
            InitializeComponent();
        }
        #endregion

        #region Event Members
        public delegate void StudentSelectionHandler(object sender, StudentEventArgs e);
        public event StudentSelectionHandler StudentSelected;

        // TODO: Exercise 2: Task 3a: Add the StartBusy public event

        // TODO: Exercise 2: Task 3b: Add the EndBusy public event

        #endregion

        #region Refresh
        public async void Refresh()
        {
            // TODO: Exercise 2: Task 3f: Raise the StartBusy event
            
            ServiceUtils utils = new ServiceUtils();

            await utils.GetStudentsByTeacher(SessionContext.UserName, OnGetStudentsByTeacherComplete);

            // TODO: Exercise 2: Task 3g: Raise the EndBusy event

        }
        #endregion

        #region Callbacks
        // Callback that displays the list of students for a teacher
        private void OnGetStudentsByTeacherComplete(IEnumerable<Student> students)
        {
            // Iterate through the set of students, construct a local student object list
            // and then data bind this to the list item template
            List<LocalStudent> resultData = new List<LocalStudent>();

            foreach (Student s in students)
            {
                LocalStudent student = new LocalStudent()
                {
                    Record = s
                };

                resultData.Add(student);
            }

            this.Dispatcher.Invoke(() => { list.ItemsSource = resultData;
                                           txtClass.Text = String.Format("Class {0}", SessionContext.CurrentTeacher.Class); });
        }        
        #endregion

        #region Events

        // TODO: Exercise 2: Task 3c: Implement the StartBusyEvent method to raise the StartBusy event

        // TODO: Exercise 2: Task 3d: Implement the EndBusyEvent method to raise the EndBusy event

        private void Student_MouseEnter(object sender, MouseEventArgs e)
        {
            // Call the OnMouseEnter event handler on the specific photograph currently under the mouse pointer
            ((StudentPhoto)sender).OnMouseEnter();
        }

        private void Student_MouseLeave(object sender, MouseEventArgs e)
        {
            // Call the OnMouseLeave event handler on the specific photograph currently under the mouse pointer
            ((StudentPhoto)sender).OnMouseLeave();
        }

        private void RemoveStudent_MouseEnter(object sender, MouseEventArgs e)
        {
            Grid grid = (Grid)sender;

            grid.Opacity = 1.0;

            StudentPhoto photo = ((Grid)grid.Parent).Children[0] as StudentPhoto;
            photo.Opacity = 0.6;
        }

        private void RemoveStudent_MouseLeave(object sender, MouseEventArgs e)
        {
            Grid grid = (Grid)sender;

            grid.Opacity = 0.3;

            StudentPhoto photo = ((Grid)grid.Parent).Children[0] as StudentPhoto;
            photo.Opacity = 1.0;
        }

        private void Student_Click(object sender, MouseButtonEventArgs e)
        {
            if (StudentSelected != null)
                StudentSelected(sender, new StudentEventArgs((sender as StudentPhoto).DataContext as LocalStudent));
        }

        private void StudentText_Click(object sender, MouseButtonEventArgs e)
        {
            if (StudentSelected != null)
                StudentSelected(sender, new StudentEventArgs((sender as TextBlock).Tag as LocalStudent));
        }

        private void AddStudent_Click(object sender, MouseButtonEventArgs e)
        {
            AddStudentDialog dialog = new AddStudentDialog();
            dialog.Closed += new EventHandler(dialog_Closed);
            dialog.ShowDialog();
        }

        private void dialog_Closed(object sender, EventArgs e)
        {
            Refresh();
        }

        private void RemoveStudent_Click(object sender, MouseButtonEventArgs e)
        {
            LocalStudent student = (sender as Grid).Tag as LocalStudent;

            MessageBoxResult button = MessageBox.Show("Would you like to remove the student?", "Student", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (button == MessageBoxResult.Yes)
            {
                ServiceUtils utils = new ServiceUtils();
                utils.RemoveStudent(SessionContext.CurrentTeacher, student.Record);
                Refresh();
            }
        }
        #endregion

    }

    public class StudentEventArgs : EventArgs
    {
        public LocalStudent Child { get; set; }

        public StudentEventArgs(LocalStudent s)
        {
            Child = s;
        }
    }
}
