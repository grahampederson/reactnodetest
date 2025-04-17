const Meeting = require('../../model/schema/meeting');
const User = require('../../model/schema/user');
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const { agenda, dateTime, attendes, attendesLead, location, related, notes, createBy } = req.body;

        // Validate attendes if provided
        if (attendes && attendes.length > 0) {
            for (const attendee of attendes) {
                if (!mongoose.Types.ObjectId.isValid(attendee)) {
                    return res.status(400).json({ error: 'Invalid attendee ID' });
                }
            }
        }

        // Validate attendesLead if provided
        if (attendesLead && attendesLead.length > 0) {
            for (const attendee of attendesLead) {
                if (!mongoose.Types.ObjectId.isValid(attendee)) {
                    return res.status(400).json({ error: 'Invalid attendee lead ID' });
                }
            }
        }

        const meeting = new Meeting({
            agenda,
            dateTime,
            attendes,
            attendesLead,
            location,
            related,
            notes,
            createBy
        });

        await meeting.save();
        res.status(200).json({ meeting });
    } catch (err) {
        console.error('Failed to create meeting:', err);
        res.status(400).json({ err, error: 'Failed to create meeting' });
    }
}

const index = async (req, res) => {
    try {
        const query = { ...req.query, deleted: false };
        
        if (query.createBy) {
            query.createBy = new mongoose.Types.ObjectId(query.createBy);
        }

        console.log('Query:', JSON.stringify(query, null, 2));

        // First, let's check what users exist
        const users = await User.find({ deleted: false });
        console.log('Available users:', users.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}` })));

        const result = await Meeting.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendees'
                }
            },
            {
                $lookup: {
                    from: 'Leads',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendeeLeads'
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    createByName: {
                        $cond: {
                            if: { $and: [{ $ne: ['$creator', null] }, { $ne: ['$creator.firstName', null] }, { $ne: ['$creator.lastName', null] }] },
                            then: { $concat: ['$creator.firstName', ' ', '$creator.lastName'] },
                            else: 'Unknown User'
                        }
                    }
                }
            },
            { $project: { creator: 0 } }
        ]);

        console.log('Aggregation result:', JSON.stringify(result, null, 2));

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to fetch meetings:', err);
        res.status(400).json({ err, error: 'Failed to fetch meetings' });
    }
}

const view = async (req, res) => {
    try {
        const meetingId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(meetingId)) {
            return res.status(400).json({ error: 'Invalid meeting ID' });
        }

        let result = await Meeting.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(meetingId), deleted: false } },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'attendees'
                }
            },
            {
                $lookup: {
                    from: 'Leads',
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'attendeeLeads'
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
            { $match: { 'creator.deleted': false } },
            {
                $addFields: {
                    createByName: { $concat: ['$creator.firstName', ' ', '$creator.lastName'] }
                }
            },
            { $project: { creator: 0 } }
        ]);

        if (result.length === 0) {
            return res.status(404).json({ message: "No meeting found." });
        }

        res.status(200).json(result[0]);
    } catch (err) {
        console.error('Failed to fetch meeting:', err);
        res.status(400).json({ err, error: 'Failed to fetch meeting' });
    }
}

const deleteData = async (req, res) => {
    try {
        const meetingId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(meetingId)) {
            return res.status(400).json({ error: 'Invalid meeting ID' });
        }
        
        const meeting = await Meeting.findById(meetingId);
        
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }
        
        await Meeting.updateOne({ _id: meetingId }, { $set: { deleted: true } });
        res.send({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ error });
    }
}

const deleteMany = async (req, res) => {
    try {
        const meetingIds = req.body;
        
        if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
            return res.status(400).json({ message: "No meeting IDs provided." });
        }
        
        // Validate all IDs
        for (const id of meetingIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: `Invalid meeting ID: ${id}` });
            }
        }
        
        const meetings = await Meeting.find({ _id: { $in: meetingIds } });
        
        if (meetings.length === 0) {
            return res.status(400).json({ message: "No meetings to delete." });
        }
        
        const updatedMeetings = await Meeting.updateMany(
            { _id: { $in: meetingIds } }, 
            { $set: { deleted: true } }
        );
        
        res.status(200).json({ message: "Meetings deleted successfully", updatedMeetings });
    } catch (err) {
        res.status(404).json({ message: "Error deleting meetings", err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }