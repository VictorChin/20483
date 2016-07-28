﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using GradesPrototype.Data;
using GradesPrototype.Services;
using GradesPrototype.Views;

namespace GradesPrototype
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataSource.CreateData();
            GotoLogon();
        }

        #region Navigation
        // Display the logon view
        public void GotoLogon()
        {
            // Display the logon view and hide the list of students and single student page
            logonPage.Visibility = Visibility.Visible;
            studentsPage.Visibility = Visibility.Collapsed;
            studentProfile.Visibility = Visibility.Collapsed;
        }

        // Display the list of students
        private void GotoStudentsPage()
        {            
            // Hide the view for a single student (if it is visible)
            studentProfile.Visibility = Visibility.Collapsed;

            // Display the list of students
            studentsPage.Visibility = Visibility.Visible;
            studentsPage.Refresh();
        }

        // Display the details for a single student
        public void GotoStudentProfile()
        {
            // Hide the list of students
            studentsPage.Visibility = Visibility.Collapsed;

            // Display the page for a single student
            studentProfile.Visibility = Visibility.Visible;
            studentProfile.Refresh();
        }
        #endregion

        #region Event Handlers

        // Handle successful logon
        private void Logon_Success(object sender, EventArgs e)
        {
            // Update the display and show the data for the logged on user
            logonPage.Visibility = Visibility.Collapsed;
            gridLoggedIn.Visibility = Visibility.Visible;
            Refresh();
        }

        // TODO: Exercise 3: Task 2a: Handle logon failure
        // Display an error message. The user must try again


        // Handle logoff
        private void Logoff_Click(object sender, RoutedEventArgs e)
        {
            // Hide all views apart from the logon view
            gridLoggedIn.Visibility = Visibility.Collapsed;
            studentsPage.Visibility = Visibility.Collapsed;
            studentProfile.Visibility = Visibility.Collapsed;
            logonPage.Visibility = Visibility.Visible;
        }

        // Handle the Back button on the Student view
        private void studentPage_Back(object sender, EventArgs e)
        {
            GotoStudentsPage();
        }

        // Handle the StudentSelected event when the user clicks a student on the Students view
        private void studentsPage_StudentSelected(object sender, StudentEventArgs e)
        {
            // TODO: Exercise 3: Task 3c: Set the current student in the global context to the student specified in the StudentEventArgs parameter
            
            // Display the details of the current student
            GotoStudentProfile();
        }

        #endregion

        #region Display Logic

        // Update the display for the logged on user (student or teacher)
        private void Refresh()
        {
            switch (SessionContext.UserRole)
            {
                case Role.Student:
                    // TODO: Exercise 3: Task 2c: Display the student name in the banner at the top of the page
                    
                    // Display the details for the current student
                    GotoStudentProfile();
                    break;

                case Role.Teacher:
                    // TODO: Exercise 3: Task 2d: Display the teacher name in the banner at the top of the page
                    
                    // Display the list of students for the teacher
                    GotoStudentsPage();                    
                    break;
            }
        }
        #endregion
    }
}
