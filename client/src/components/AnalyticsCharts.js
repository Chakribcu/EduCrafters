import React from 'react';

// This component shows all the charts for the analytics dashboard

const AnalyticsCharts = ({ data }) => {
  // Helper function to generate a random color
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Create color variants for the charts
  const generateChartColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(getRandomColor());
    }
    return colors;
  };

  // Render a bar chart for revenue by month
  const renderRevenueChart = () => {
    if (!data || !data.revenueData || !data.revenueData.length) {
      return <div className="alert alert-info">No revenue data available</div>;
    }

    const chartColors = ['#4C84FF', '#B5CCFF', '#7BA7FF', '#2962FF', '#1E56E0', '#0D47A1'];

    return (
      <div className="chart-container">
        <h5 className="chart-title">Revenue by Month</h5>
        <div className="revenue-chart">
          {data.revenueData.map((item, index) => (
            <div key={index} className="revenue-bar-container">
              <div 
                className="revenue-bar" 
                style={{ 
                  height: `${(item.revenue / Math.max(...data.revenueData.map(d => d.revenue)) * 100) || 1}%`,
                  backgroundColor: chartColors[index % chartColors.length]
                }}
              ></div>
              <div className="revenue-month">{item.name}</div>
              <div className="revenue-amount">£{item.revenue}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a donut chart for student engagement
  const renderEngagementChart = () => {
    if (!data || !data.studentEngagement || !data.studentEngagement.length) {
      return <div className="alert alert-info">No engagement data available</div>;
    }

    const total = data.studentEngagement.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return <div className="alert alert-info">No engagement data available</div>;

    const chartColors = ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2'];
    
    let startAngle = 0;
    
    return (
      <div className="chart-container">
        <h5 className="chart-title">Student Engagement</h5>
        <div className="donut-chart-container">
          <div className="donut-chart">
            {data.studentEngagement.map((item, index) => {
              const percentage = (item.count / total) * 100;
              const dashArray = `${percentage} ${100 - percentage}`;
              const rotate = `rotate(${startAngle}deg)`;
              startAngle += percentage * 3.6; // 3.6 degrees per percentage point (360 / 100)
              
              return (
                <div 
                  key={index} 
                  className="donut-segment" 
                  style={{ 
                    '--dash-array': dashArray,
                    '--segment-color': chartColors[index % chartColors.length],
                    '--rotation': rotate
                  }}
                ></div>
              );
            })}
            <div className="donut-center">{total}</div>
          </div>
          <div className="donut-legend">
            {data.studentEngagement.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                ></div>
                <div className="legend-text">
                  {item.name}: {item.count} ({Math.round((item.count / total) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render a line chart for enrollments by month
  const renderEnrollmentsChart = () => {
    if (!data || !data.enrollmentsByMonth || !data.enrollmentsByMonth.length) {
      return <div className="alert alert-info">No enrollment data available</div>;
    }

    const maxEnrollments = Math.max(...data.enrollmentsByMonth.map(d => d.enrollments));
    
    return (
      <div className="chart-container">
        <h5 className="chart-title">Enrollments by Month</h5>
        <div className="line-chart">
          <svg viewBox="0 0 600 200" className="enrollment-chart">
            {/* X and Y axes */}
            <line x1="40" y1="10" x2="40" y2="170" stroke="#ccc" />
            <line x1="40" y1="170" x2="580" y2="170" stroke="#ccc" />
            
            {/* Plot the enrollment data */}
            <polyline
              fill="none"
              stroke="#4C84FF"
              strokeWidth="3"
              points={data.enrollmentsByMonth.map((item, index) => {
                const x = 40 + ((580 - 40) / (data.enrollmentsByMonth.length - 1 || 1)) * index;
                const y = 170 - ((item.enrollments / (maxEnrollments || 1)) * 150);
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Data points */}
            {data.enrollmentsByMonth.map((item, index) => {
              const x = 40 + ((580 - 40) / (data.enrollmentsByMonth.length - 1 || 1)) * index;
              const y = 170 - ((item.enrollments / (maxEnrollments || 1)) * 150);
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="5" fill="#4C84FF" />
                  <text x={x} y="185" textAnchor="middle" fontSize="12">{item.name}</text>
                  <text x={x} y={y - 10} textAnchor="middle" fontSize="10">{item.enrollments}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // Render a horizontal bar chart for course completion rates
  const renderCompletionRatesChart = () => {
    if (!data || !data.courseCompletionRates || !data.courseCompletionRates.length) {
      return <div className="alert alert-info">No completion data available</div>;
    }

    const chartColors = generateChartColors(data.courseCompletionRates.length);
    
    return (
      <div className="chart-container">
        <h5 className="chart-title">Course Completion Rates</h5>
        <div className="completion-chart">
          {data.courseCompletionRates.map((item, index) => (
            <div key={index} className="completion-item">
              <div className="course-name">{item.name.length > 20 ? `${item.name.substring(0, 20)}...` : item.name}</div>
              <div className="completion-bar-container">
                <div 
                  className="completion-bar" 
                  style={{ 
                    width: `${item.value}%`,
                    backgroundColor: chartColors[index % chartColors.length]
                  }}
                >
                  {item.value}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a table for course statistics
  const renderCourseStatsTable = () => {
    if (!data || !data.courseStats || !data.courseStats.length) {
      return <div className="alert alert-info">No course statistics available</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Course</th>
              <th>Enrollments</th>
              <th>Revenue</th>
              <th>Avg Progress</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.courseStats.map((course, index) => (
              <tr key={index}>
                <td>{course.title}</td>
                <td>{course.enrollments}</td>
                <td>£{course.revenue}</td>
                <td>{course.avgProgress}%</td>
                <td>{course.completionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="analytics-charts">
      <div className="row mb-4">
        <div className="col-md-6">
          {renderRevenueChart()}
        </div>
        <div className="col-md-6">
          {renderEngagementChart()}
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-6">
          {renderEnrollmentsChart()}
        </div>
        <div className="col-md-6">
          {renderCompletionRatesChart()}
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <h5>Course Performance</h5>
          {renderCourseStatsTable()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;