import React, { useState, useEffect } from "react";
import moment from "moment";
import { DatePicker, Tooltip } from "antd";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Calendar as CalendarIcon,
  Send as SendIcon,
  Clock as PendingIcon,
  CheckCircle as ApprovedIcon,
  XCircle as RejectedIcon,
} from "lucide-react";
import ProfileSidebar from "../../components/sidebar/emplyee_profilesidebar";

const { RangePicker } = DatePicker;

function Requestedleave() {
  const [fromdate, setFromDate] = useState(null);
  const [todate, setToDate] = useState(null);
  const [description, setDescription] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  
  useEffect(() => {
    fetchLeaves();
    // Get current user's name
    const currentUser = JSON.parse(localStorage.getItem("currentuser"));
    if (currentUser) {
      setEmployeeName(currentUser.fullName || "Employee");
    }
  }, []);

  const filterByDate = (dates) => {
    if (dates && dates.length === 2) {
      const [start, end] = dates;
      if (start.isAfter(end)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Date Range",
          text: "Start date must be before end date.",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "bg-blue-600 hover:bg-blue-700 rounded-xl",
          },
        });
        return;
      }
      setFromDate(start);
      setToDate(end);
    }
  };

  const leaveRequest = async (e) => {
    e.preventDefault();
    if (!fromdate || !todate) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a valid date range.",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "bg-blue-600 hover:bg-blue-700 rounded-xl",
        },
      });
      return;
    }
    if (description.trim().length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient Description",
        text: "Please provide a more detailed reason for your leave.",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "bg-blue-600 hover:bg-blue-700 rounded-xl",
        },
      });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentuser"));
    const requestDetails = {
      userid: currentUser._id,
      fromdate: fromdate.format("DD-MM-YYYY"),
      todate: todate.format("DD-MM-YYYY"),
      description: description.trim(),
    };

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/leaves/leaverequest", requestDetails);
      Swal.fire({
        icon: "success",
        title: "Leave Request Submitted",
        text: "Your leave request has been processed successfully.",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "rounded-2xl",
        },
      });
      setFromDate(null);
      setToDate(null);
      setDescription("");
      fetchLeaves();
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "Unable to submit leave request. Please try again.",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "bg-red-600 hover:bg-red-700 rounded-xl",
        },
      });
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem("currentuser"));
      const res = await axios.post("http://localhost:5000/api/leaves/getleaverequestedbyuserid", {
        userid: currentUser._id,
      });
      setLeaves(res.data.sort((a, b) => new Date(b.fromdate) - new Date(a.fromdate)));
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const STATUS_CONFIG = {
    Pending: {
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: PendingIcon,
      description: "Your request is under review",
    },
    Approved: {
      color: "text-green-600 bg-green-50 border-green-200",
      icon: ApprovedIcon,
      description: "Leave request approved",
    },
    Dissapproved: { // Note: Fixed the typo in the key name to match your backend
      color: "text-red-600 bg-red-50 border-red-200",
      icon: RejectedIcon,
      description: "Leave request not approved",
    },
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64">
      <ProfileSidebar />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-green-500">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <CalendarIcon className="mr-4 text-green-600" size={36} />
              Leave Management
            </h1>
            <p className="text-gray-500 mt-2">Submit and track your leave requests efficiently</p>
            <p className="text-gray-700 mt-1">Welcome, <span className="font-semibold">{employeeName}</span></p>
          </div>
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
            <form onSubmit={leaveRequest} className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
                <RangePicker
                  format="DD-MM-YYYY"
                  onChange={filterByDate}
                  value={[fromdate, todate]}
                  className="w-full rounded-xl"
                  disabledDate={(current) => current && current < moment().startOf("day")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Reason</label>
                <textarea
                  rows={3}
                  placeholder="Describe the reason for your leave request"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin">
                      <SendIcon size={20} />
                    </div>
                  ) : (
                    <>
                      <SendIcon size={20} />
                      Submit Leave Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Your Leave Requests</h2>
            </div>
            {leaves.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                No leave requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      {["#", "Employee", "From", "To", "Duration", "Reason", "Status"].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave, index) => {
                      const StatusIcon = STATUS_CONFIG[leave.status]?.icon || CalendarIcon;
                      const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.Pending;
                      return (
                        <tr key={leave._id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">{index + 1}</td>
                          <td className="px-6 py-4">{employeeName}</td>
                          <td className="px-6 py-4">{leave.fromdate}</td>
                          <td className="px-6 py-4">{leave.todate}</td>
                          <td className="px-6 py-4">
                            {moment(leave.todate, "DD-MM-YYYY").diff(
                              moment(leave.fromdate, "DD-MM-YYYY"),
                              "days"
                            ) + 1} days
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">{leave.description}</td>
                          <td className="px-6 py-4">
                            <Tooltip title={statusConfig.description}>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} border`}
                              >
                                <StatusIcon size={16} className="mr-2" />
                                {leave.status}
                              </span>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Requestedleave;